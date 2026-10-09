export function initMode(viewer) {
  const btn3d = document.getElementById('mode-3d');
  const btnAr = document.getElementById('mode-ar');
  const arLaunch = document.querySelector('.ar-launch');
  const variants = document.querySelector('.variants');
  const unsupportedOverlay = document.getElementById('unsupported-overlay');

  let currentMode = '3d';

  function setMode(mode) {
    currentMode = mode;
    const is3D = mode === '3d';

    btn3d.classList.toggle('mode-toggle__btn--active', is3D);
    btnAr.classList.toggle('mode-toggle__btn--active', !is3D);
    btn3d.setAttribute('aria-selected', is3D);
    btnAr.setAttribute('aria-selected', !is3D);

    viewer.autoRotate = is3D && !viewer.hasAttribute('user-interacted');
    arLaunch.classList.toggle('ar-launch--hidden', is3D);
    unsupportedOverlay.classList.remove('unsupported-overlay--visible');

    if (variants) {
      variants.classList.toggle('variants--hidden', !is3D);
    }
  }

  function on3dClick() { setMode('3d'); }
  function onArClick() { setMode('ar'); }

  btn3d?.addEventListener('click', on3dClick);
  btnAr?.addEventListener('click', onArClick);

  return {
    setMode,
    getMode: () => currentMode,
    destroy() {
      btn3d?.removeEventListener('click', on3dClick);
      btnAr?.removeEventListener('click', onArClick);
    }
  };
}