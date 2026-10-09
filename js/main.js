import { initViewer } from './viewer.js';
import { initMode } from './mode.js';
import { initAR } from './ar.js';
import { initVariants } from './variants.js';
import { initHotspots } from './hotspots.js';
import { initIdle } from './idle.js';
import { registerSW } from './sw-register.js';

async function main() {
  try {
    const response = await fetch('config/product.json');
    if (!response.ok) throw new Error('Failed to load config');
    const config = await response.json();

    document.title = config.name;
    document.querySelector('.top-bar__title').textContent = config.name;

    const viewerAPI = initViewer(config);
    const modeAPI = initMode(viewerAPI.viewer);
    const arAPI = initAR(viewerAPI.viewer, config);
    const variantsAPI = initVariants(viewerAPI.viewer, config);
    const hotspotsAPI = initHotspots(viewerAPI.viewer, config);
    const idleAPI = initIdle(() => {
      modeAPI.setMode('3d');
      variantsAPI?.reset();
      viewerAPI.viewer.autoRotate = true;
    });

    window.addEventListener('beforeunload', () => {
      viewerAPI.destroy();
      modeAPI.destroy();
      arAPI.destroy();
      variantsAPI?.destroy();
      hotspotsAPI?.destroy();
      idleAPI.destroy();
    });

    registerSW();

  } catch (err) {
    console.error('Initialization failed:', err);
    const errorOverlay = document.getElementById('error-overlay');
    if (errorOverlay) {
      errorOverlay.querySelector('.error-overlay__message').textContent =
        'Failed to load product configuration. Please refresh the page.';
      errorOverlay.classList.add('error-overlay--visible');
    }
  }
}

document.addEventListener('DOMContentLoaded', main);