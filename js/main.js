import { initViewer } from "./viewer.js";
import { initHotspots } from "./hotspots.js";
import { initIdle } from "./idle.js";
import { registerSW } from "./sw-register.js";

async function main() {
  try {
    const response = await fetch("config/product.json");
    if (!response.ok) throw new Error("Failed to load config");
    const config = await response.json();

    document.title = config.name;

    const viewerAPI = initViewer(config);
    const hotspotsAPI = initHotspots(viewerAPI.viewer, config);
    const idleAPI = initIdle(() => {
      viewerAPI.viewer.autoRotate = true;
    });

    window.addEventListener("beforeunload", () => {
      viewerAPI.destroy();
      hotspotsAPI?.destroy();
      idleAPI.destroy();
    });

    registerSW();
  } catch (err) {
    console.error("Initialization failed:", err);
    const errorOverlay = document.getElementById("error-overlay");
    if (errorOverlay) {
      errorOverlay.querySelector(".error-overlay__message").textContent =
        "Failed to load product configuration. Please refresh the page.";
      errorOverlay.classList.add("error-overlay--visible");
    }
  }
}

document.addEventListener("DOMContentLoaded", main);
