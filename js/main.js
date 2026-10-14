// Stock-it entry point
// Views swap into #view; nav buttons highlight the active one.

import * as products from './products.js';
import * as modal from './modal.js';

const viewEl = document.getElementById('view');
const navButtons = document.querySelectorAll('.nav-btn');

// --- transient toast (for errors outside a modal) ------------------

const toastEl = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 2500);
}

// --- Products view -------------------------------------------------

function productsTemplate() {
  return `
    <div id="product-list">${products.render()}</div>
    <button class="fab" id="new-product-btn" type="button" aria-label="New product">+</button>`;
}

function renderProductList() {
  const el = document.getElementById('product-list');
  if (el) el.innerHTML = products.render();
}

const NEW_PRODUCT_FORM = `
  <input class="text-input" type="text" id="m-name" placeholder="Product name" autocomplete="off">
  <div class="add-form-row">
    <input class="text-input qty-field" type="number" id="m-qty" inputmode="numeric"
           min="0" step="1" value="1" aria-label="Quantity">
    <input class="text-input price-field" type="number" id="m-price" inputmode="decimal"
           min="0" step="0.01" placeholder="Price" aria-label="Price">
  </div>
  <p class="form-error" hidden></p>
  <button class="btn btn-primary modal-submit" type="submit">Add product</button>`;

function openNewProductModal() {
  modal.open({
    title: 'New Product',
    body: NEW_PRODUCT_FORM,
    onSubmit: (form) => {
      const name = form.querySelector('#m-name').value;
      const qty = form.querySelector('#m-qty').value;
      const price = form.querySelector('#m-price').value;
      products.add(name, qty, price);
      renderProductList();
    },
  });
}

function openEditModal(id) {
  const p = products.get(id);
  modal.open({
    title: 'Edit Product',
    body: `
      <input class="text-input" type="text" id="e-name" placeholder="Product name"
             autocomplete="off" value="${products.escapeHtml(p.name)}">
      <input class="text-input" type="number" id="e-price" inputmode="decimal"
             min="0" step="0.01" placeholder="Price" aria-label="Price" value="${p.price}">
      <p class="form-error" hidden></p>
      <div class="modal-actions">
        <button class="btn btn-danger" type="submit" data-action="delete">Delete</button>
        <button class="btn btn-primary" type="submit" data-action="save">Save</button>
      </div>`,
    onSubmit: (form, submitter) => {
      if (submitter?.dataset.action === 'delete') {
        if (!confirm(`Delete "${p.name}"?`)) return false; // keep modal open
        products.remove(id);
        renderProductList();
        return;
      }
      products.update(id, {
        name: form.querySelector('#e-name').value,
        price: form.querySelector('#e-price').value,
      });
      renderProductList();
    },
  });
}

function bindProductsView() {
  document.getElementById('new-product-btn').addEventListener('click', openNewProductModal);

  const listEl = document.getElementById('product-list');

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.tagName === 'INPUT') return;
    const row = btn.closest('.product-row');
    if (!row) return;
    const id = row.dataset.id;
    const action = btn.dataset.action;

    if (action === 'inc') products.adjustQty(id, 1);
    else if (action === 'dec') products.adjustQty(id, -1);
    else if (action === 'edit') {
      openEditModal(id);
      return;
    } else return;

    renderProductList();
  });

  listEl.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-action="set"]');
    if (!input) return;
    const row = input.closest('.product-row');
    products.setQty(row.dataset.id, input.value);
    renderProductList();
  });

  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input[data-action="set"]')) {
      e.preventDefault();
      e.target.blur(); // triggers change → re-render
    }
  });
}

// --- View routing --------------------------------------------------

const views = {
  dashboard: () => `
    <section class="card empty-state">
      <p>Dashboard — coming in Phase 6.</p>
      <p class="muted">Totals, stock value and low-stock alerts go here.</p>
    </section>`,
  products: productsTemplate,
  settings: () => `
    <section class="card empty-state">
      <p>Settings — coming in Phase 7.</p>
      <p class="muted">Backup, restore and theme options go here.</p>
    </section>`,
};

const afterRender = {
  products: bindProductsView,
};

function showView(name) {
  const render = views[name] || views.dashboard;
  viewEl.innerHTML = render();
  afterRender[name]?.();
  navButtons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === name);
  });
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

showView('dashboard');
