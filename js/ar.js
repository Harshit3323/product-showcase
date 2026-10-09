export function initAR(viewer, config) {
  const arBtn = document.getElementById('ar-launch-btn');
  const arTip = document.getElementById('ar-tip-overlay');
  const arTipDismiss = document.getElementById('ar-tip-dismiss');
  const unsupportedOverlay = document.getElementById('unsupported-overlay');
  const unsupportedMsg = unsupportedOverlay?.querySelector('.unsupported-overlay__message');

  let canAR = false;
  let tipShown = false;

  async function checkARSupport() {
    try {
      canAR = await viewer.canActivateAR();
    } catch {
      canAR = false;
    }
    updateARButton();
  }

  function updateARButton() {
    if (!arBtn) return;
    if (canAR) {
      arBtn.disabled = false;
      arBtn.textContent = 'View in your space';
      arBtn.classList.remove('btn--secondary');
      arBtn.classList.add('btn--primary');
    } else {
      arBtn.disabled = true;
      arBtn.textContent = 'AR not supported';
      arBtn.classList.remove('btn--primary');
      arBtn.classList.add('btn--secondary');
    }
  }

  async function onARLaunch() {
    if (!canAR) {
      showUnsupported();
      return;
    }

    try {
      viewer.arPlacement = config.ar.placement || 'floor';
      viewer.arScale = config.ar.scale || 'auto';
      await viewer.activateAR();
    } catch (err) {
      console.error('AR activation failed:', err);
      showToast('Could not start AR. Please try again.');
    }
  }

  function onARStatus(event) {
    const status = event.detail.status;
    if (status === 'session-started') {
      showARTip();
    } else if (status === 'failed') {
      showToast('AR session failed. Please ensure you have a flat, well-lit surface.');
    }
  }

  function showARTip() {
    if (tipShown) return;
    try {
      tipShown = sessionStorage.getItem('arTipShown') === 'true';
    } catch {}
    if (tipShown) return;

    tipShown = true;
    try { sessionStorage.setItem('arTipShown', 'true'); } catch {}
    arTip?.classList.remove('ar-tip-overlay--hidden');
  }

  function dismissARTip() {
    arTip?.classList.add('ar-tip-overlay--hidden');
  }

  function showUnsupported() {
    if (unsupportedMsg) {
      unsupportedMsg.textContent = 'Your device does not support AR. You can still explore the product in 3D mode.';
    }
    unsupportedOverlay?.classList.add('unsupported-overlay--visible');
    setTimeout(() => unsupportedOverlay?.classList.remove('unsupported-overlay--visible'), 5000);
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('toast--visible');
      setTimeout(() => toast.classList.remove('toast--visible'), 3000);
    }
  }

  checkARSupport();

  viewer.addEventListener('ar-status', onARStatus);
  arBtn?.addEventListener('click', onARLaunch);
  arTipDismiss?.addEventListener('click', dismissARTip);

  return {
    destroy() {
      viewer.removeEventListener('ar-status', onARStatus);
      arBtn?.removeEventListener('click', onARLaunch);
      arTipDismiss?.removeEventListener('click', dismissARTip);
    }
  };
}