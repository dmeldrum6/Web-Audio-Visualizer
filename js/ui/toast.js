const toastContainer = document.getElementById('toast-container');

function showToast(message, type = 'info', duration = 4000) {
  const el = document.createElement('div');
  el.className = 'toast' + (type !== 'info' ? ' ' + type : '');
  el.textContent = message;
  toastContainer.appendChild(el);

  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
}
