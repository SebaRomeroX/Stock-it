// Stock-it entry point — phase 1 skeleton
// Views swap into #view; nav buttons highlight the active one.

const viewEl = document.getElementById('view');
const navButtons = document.querySelectorAll('.nav-btn');

const views = {
  dashboard: () => `
    <section class="card empty-state">
      <p>Dashboard — coming in Phase 6.</p>
      <p class="muted">Totals, stock value and low-stock alerts go here.</p>
    </section>`,
  products: () => `
    <section class="card empty-state">
      <p>Products — coming in Phase 3.</p>
      <p class="muted">Add, edit and delete products.</p>
    </section>`,
  settings: () => `
    <section class="card empty-state">
      <p>Settings — coming in Phase 7.</p>
      <p class="muted">Backup, restore and theme options go here.</p>
    </section>`,
};

function showView(name) {
  const render = views[name] || views.dashboard;
  viewEl.innerHTML = render();
  navButtons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === name);
  });
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

showView('dashboard');
