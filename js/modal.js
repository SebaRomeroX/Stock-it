// Stock-it — reusable modal (bottom sheet on mobile, dialog on desktop)
// Shell lives in index.html outside #view so view swaps never destroy it.

const overlay = document.getElementById('modal');
const titleEl = document.getElementById('modal-title');
const bodyEl = document.getElementById('modal-body');
const closeBtn = overlay.querySelector('.modal-close');

let onSubmit = null;
let lastFocus = null;

export function open({ title, body, onSubmit: submit }) {
  lastFocus = document.activeElement;
  onSubmit = submit;
  titleEl.textContent = title;
  bodyEl.innerHTML = `<form class="modal-form" novalidate>${body}</form>`;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  const first = bodyEl.querySelector('input, textarea, select');
  first?.focus();
}

export function close() {
  if (overlay.hidden) return;
  overlay.hidden = true;
  bodyEl.innerHTML = '';
  onSubmit = null;
  document.body.style.overflow = '';
  lastFocus?.focus();
}

function showError(form, message) {
  const el = form.querySelector('.form-error');
  if (!el) {
    alert(message);
    return;
  }
  el.textContent = message;
  el.hidden = false;
  clearTimeout(showError.t);
  showError.t = setTimeout(() => (el.hidden = true), 3000);
}

// --- wiring (runs once at import) ---------------------------------

closeBtn.addEventListener('click', close);

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) close();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlay.hidden) close();
});

bodyEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  try {
    onSubmit?.(form);
    close();
  } catch (err) {
    showError(form, err.message);
  }
});
