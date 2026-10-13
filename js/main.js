// Stock-it entry point
// Views swap into #view; nav buttons highlight the active one.

import * as products from './products.js';

const viewEl = document.getElementById('view');
const navButtons = document.querySelectorAll('.nav-btn');

// --- Products view -------------------------------------------------

function productsTemplate() {
  return `
    <form class="add-form card" id="add-form" novalidate>
      <input class="text-input" type="text" id="p-name" name="name"
             placeholder="Product name" autocomplete="off" required>
      <div class="add-form-row">
        <input class="text-input qty-field" type="number" id="p-qty" name="qty"
               inputmode="numeric" min="0" step="1" value="1" aria-label="Quantity">
        <input class="text-input price-field" type="number" id="p-price" name="price"
               inputmode="decimal" min="0" step="0.01" placeholder="Price" aria-label="Price">
        <button class="btn btn-primary" type="submit">Add</button>
      </div>
      <p class="form-error" id="form-error" hidden></p>
    </form>
    <div id="product-list">${products.render()}</div>`;
}

function renderProductList() {
  const el = document.getElementById('product-list');
  if (el) el.innerHTML = products.render();
}

function showFormError(msg) {
  const el = document.getElementById('form-error');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showFormError.t);
  showFormError.t = setTimeout(() => (el.hidden = true), 2500);
}

function bindProductsView() {
  const form = document.getElementById('add-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('p-name');
    const qtyInput = document.getElementById('p-qty');
    const priceInput = document.getElementById('p-price');
    try {
      products.add(nameInput.value, qtyInput.value, priceInput.value);
      nameInput.value = '';
      qtyInput.value = '1';
      priceInput.value = '';
      nameInput.focus();
      renderProductList();
    } catch (err) {
      showFormError(err.message);
    }
  });

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
    else if (action === 'price') {
      const name = row.querySelector('.product-name').textContent;
      const current = row.querySelector('.product-total').textContent;
      const input = prompt(`Price for "${name}" (${current} total):`, row.dataset.price || '0');
      if (input === null) return;
      try {
        products.setPrice(id, input);
      } catch (err) {
        showFormError(err.message);
        return;
      }
    } else if (action === 'del') {
      const name = row.querySelector('.product-name').textContent;
      if (!confirm(`Delete "${name}"?`)) return;
      products.remove(id);
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
