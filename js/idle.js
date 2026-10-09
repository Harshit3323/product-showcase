export function initIdle(onIdle) {
  const IDLE_TIME = 60000;
  let timer = null;

  function resetTimer() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onIdle, IDLE_TIME);
  }

  function onActivity() {
    resetTimer();
  }

  ['mousedown', 'touchstart', 'keydown', 'wheel'].forEach(event => {
    document.addEventListener(event, onActivity, { passive: true });
  });

  resetTimer();

  return {
    destroy() {
      if (timer) clearTimeout(timer);
      ['mousedown', 'touchstart', 'keydown', 'wheel'].forEach(event => {
        document.removeEventListener(event, onActivity);
      });
    }
  };
}