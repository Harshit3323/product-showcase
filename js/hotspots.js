export function initHotspots(viewer, config) {
  const container = document.getElementById('hotspots-container');
  if (!container || !config.hotspots?.length) {
    return null;
  }

  function parseVector(str) {
    const parts = str.replace(/m/g, '').split(' ').map(Number);
    return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
  }

  function createHotspot(hotspot, index) {
    const el = document.createElement('div');
    el.className = 'hotspot';
    el.dataset.index = index;
    el.innerHTML = `
      <button class="hotspot__dot" aria-label="${hotspot.label}"></button>
      <span class="hotspot__label">${hotspot.label}</span>
    `;
    return el;
  }

  config.hotspots.forEach((hotspot, index) => {
    const el = createHotspot(hotspot, index);
    container.appendChild(el);
  });

  return {
    destroy() {
      container.innerHTML = '';
    }
  };
}