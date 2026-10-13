// Stock-it — products module
// Owns the product list: add, adjust quantity, delete, render.

import { load, save } from './storage.js';

const KEY = 'products';

function all() {
  const data = load(KEY, []);
  if (!Array.isArray(data)) return [];
  // Migration: products stored before the price feature get price 0.
  return data.map((p) => ({ ...p, price: Number(p.price) || 0 }));
}

// Money math in cents to avoid float drift.
const CURRENCY = 'USD'; // swap when Settings lands

const money = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: CURRENCY,
});

export function formatMoney(value) {
  return money.format(value);
}

function cleanPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) throw new Error('Price must be 0 or more');
  return Math.round(n * 100) / 100;
}

// Total value of a product in cents: unit price cents × qty.
function totalCents(product) {
  return Math.round(product.price * 100) * product.qty;
}

function persist(list) {
  save(KEY, list);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function list() {
  return all();
}

export function add(name, qty, price) {
  const cleanName = String(name).trim();
  const cleanQty = Math.max(0, Math.floor(Number(qty) || 0));
  if (!cleanName) throw new Error('Name is required');

  const product = {
    id: uid(),
    name: cleanName,
    qty: cleanQty,
    price: price === undefined || price === '' ? 0 : cleanPrice(price),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const list = all();
  list.push(product);
  persist(list);
  return product;
}

function findIndex(list, id) {
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Product not found');
  return index;
}

export function setQty(id, qty) {
  const list = all();
  const index = findIndex(list, id);
  list[index].qty = Math.max(0, Math.floor(Number(qty) || 0));
  list[index].updatedAt = Date.now();
  persist(list);
  return list[index];
}

export function adjustQty(id, delta) {
  const list = all();
  const index = findIndex(list, id);
  list[index].qty = Math.max(0, list[index].qty + delta);
  list[index].updatedAt = Date.now();
  persist(list);
  return list[index];
}

export function setPrice(id, price) {
  const list = all();
  const index = findIndex(list, id);
  list[index].price = cleanPrice(price);
  list[index].updatedAt = Date.now();
  persist(list);
  return list[index];
}

export function remove(id) {
  const list = all();
  const index = findIndex(list, id);
  const [deleted] = list.splice(index, 1);
  persist(list);
  return deleted;
}

export function render() {
  // Out-of-stock first, original order preserved otherwise.
  const products = all().slice().sort((a, b) => {
    const aOut = a.qty === 0 ? 0 : 1;
    const bOut = b.qty === 0 ? 0 : 1;
    return aOut - bOut;
  });

  if (products.length === 0) {
    return `
      <section class="card empty-state">
        <p>No products yet.</p>
        <p class="muted">Add your first product above.</p>
      </section>`;
  }

  const rows = products
    .map((p) => {
      const unitCents = Math.round(p.price * 100);
      const cents = totalCents(p);
      return `
      <li class="product-row${p.qty === 0 ? ' is-out' : ''}" data-id="${p.id}" data-price="${p.price}">
        <div class="product-info">
          <div class="product-title">
            <span class="product-name">${escapeHtml(p.name)}</span>
            ${p.qty === 0 ? '<span class="stock-badge">No stock</span>' : ''}
          </div>
          <button class="product-meta" type="button" data-action="price"
                  aria-label="Edit price of ${escapeHtml(p.name)}">
            ${formatMoney(unitCents / 100)} × ${p.qty} =
            <span class="product-total">${formatMoney(cents / 100)}</span>
          </button>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" type="button" data-action="dec" aria-label="Decrease quantity of ${escapeHtml(p.name)}">−</button>
          <input class="qty-input" type="number" inputmode="numeric" min="0" step="1"
                 value="${p.qty}" data-action="set"
                 aria-label="Quantity of ${escapeHtml(p.name)}">
          <button class="qty-btn" type="button" data-action="inc" aria-label="Increase quantity of ${escapeHtml(p.name)}">+</button>
        </div>
        <button class="delete-btn" type="button" data-action="del" aria-label="Delete ${escapeHtml(p.name)}">×</button>
      </li>`;
    })
    .join('');

  const storageCents = products.reduce((sum, p) => sum + totalCents(p), 0);

  return `
    <ul class="product-list">
      ${rows}
    </ul>
    <p class="muted list-summary">${products.length} product${products.length === 1 ? '' : 's'} · Storage value:
      <strong class="storage-value">${formatMoney(storageCents / 100)}</strong></p>`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
