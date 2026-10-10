// Stock-it — products module
// Owns the product list: add, adjust quantity, delete, render.

import { load, save } from './storage.js';

const KEY = 'products';

function all() {
  const data = load(KEY, []);
  return Array.isArray(data) ? data : [];
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

export function add(name, qty) {
  const cleanName = String(name).trim();
  const cleanQty = Math.max(0, Math.floor(Number(qty) || 0));
  if (!cleanName) throw new Error('Name is required');

  const product = {
    id: uid(),
    name: cleanName,
    qty: cleanQty,
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

export function remove(id) {
  const list = all();
  const index = findIndex(list, id);
  const [deleted] = list.splice(index, 1);
  persist(list);
  return deleted;
}

export function render() {
  const products = all();

  if (products.length === 0) {
    return `
      <section class="card empty-state">
        <p>No products yet.</p>
        <p class="muted">Add your first product above.</p>
      </section>`;
  }

  const rows = products
    .map(
      (p) => `
      <li class="product-row${p.qty === 0 ? ' is-out' : ''}" data-id="${p.id}">
        <span class="product-name">${escapeHtml(p.name)}</span>
        <div class="qty-controls">
          <button class="qty-btn" type="button" data-action="dec" aria-label="Decrease quantity of ${escapeHtml(p.name)}">−</button>
          <input class="qty-input" type="number" inputmode="numeric" min="0" step="1"
                 value="${p.qty}" data-action="set"
                 aria-label="Quantity of ${escapeHtml(p.name)}">
          <button class="qty-btn" type="button" data-action="inc" aria-label="Increase quantity of ${escapeHtml(p.name)}">+</button>
        </div>
        <button class="delete-btn" type="button" data-action="del" aria-label="Delete ${escapeHtml(p.name)}">×</button>
      </li>`
    )
    .join('');

  return `
    <ul class="product-list">
      ${rows}
    </ul>
    <p class="muted list-summary">${products.length} product${products.length === 1 ? '' : 's'}</p>`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
