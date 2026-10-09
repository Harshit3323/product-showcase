export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registered:', reg.scope);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast();
          }
        });
      });
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
    }
  });

  function showUpdateToast() {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'New version available. Refresh to update.';
      toast.classList.add('toast--visible');
      toast.onclick = () => window.location.reload();
    }
  }
}