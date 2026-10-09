export function initViewer(config) {
  const viewer = document.querySelector("model-viewer");
  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingProgress = document.getElementById("loading-progress");
  const errorOverlay = document.getElementById("error-overlay");
  const retryBtn = document.getElementById("retry-btn");
  const resetBtn = document.getElementById("reset-view-btn");

  if (!viewer) return;

  viewer.src = config.model;
  if (config.iosModel) {
    viewer.setAttribute("ios-src", config.iosModel);
  }
  viewer.poster = config.poster;
  viewer.alt = config.name;

  const [minAzimuth, minPolar, minRadius] = parseOrbit(config.camera.minOrbit);
  const [maxAzimuth, maxPolar, maxRadius] = parseOrbit(config.camera.maxOrbit);
  const [defAzimuth, defPolar, defRadius] = parseOrbit(config.camera.orbit);

  viewer.minCameraOrbit = `${minAzimuth} ${minPolar} ${minRadius}`;
  viewer.maxCameraOrbit = `${maxAzimuth} ${maxPolar} ${maxRadius}`;
  viewer.cameraOrbit = `${defAzimuth} ${defPolar} ${defRadius}`;

  viewer.cameraControls = true;
  viewer.autoRotate = true;
  viewer.autoRotateDelay = 0;
  viewer.interactionPolicy = "always";
  viewer.shadowIntensity = 0.6;
  viewer.shadowSoftness = 1;
  viewer.environmentImage = "neutral";

  let userInteracted = false;

  function onLoad() {
    loadingOverlay.classList.add("loading-overlay--hidden");
    errorOverlay.classList.remove("error-overlay--visible");
  }

  function onProgress(event) {
    const percent =
      event.detail.total > 0
        ? (event.detail.loaded / event.detail.total) * 100
        : 0;
    loadingProgress.style.width = `${percent}%`;
  }

  function onError() {
    loadingOverlay.classList.add("loading-overlay--hidden");
    errorOverlay.classList.add("error-overlay--visible");
  }

  function onInteraction() {
    if (!userInteracted) {
      userInteracted = true;
      viewer.autoRotate = false;
    }
  }

  function onModelTap(event) {
    if (!viewer.positionAndNormalFromPoint(event.clientX, event.clientY))
      return;

    viewer.play({ repetitions: 1 });
  }

  function onRetry() {
    errorOverlay.classList.remove("error-overlay--visible");
    loadingOverlay.classList.remove("loading-overlay--hidden");
    loadingProgress.style.width = "0%";
    viewer.src = config.model;
  }

  function onReset() {
    viewer.cameraOrbit = `${defAzimuth} ${defPolar} ${defRadius}`;
    viewer.fieldOfView = "45deg";
  }

  viewer.addEventListener("load", onLoad);
  viewer.addEventListener("progress", onProgress);
  viewer.addEventListener("error", onError);
  viewer.addEventListener("camera-change", onInteraction);
  viewer.addEventListener("click", onModelTap);
  retryBtn?.addEventListener("click", onRetry);
  resetBtn?.addEventListener("click", onReset);

  return {
    viewer,
    destroy() {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("progress", onProgress);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("camera-change", onInteraction);
      viewer.removeEventListener("click", onModelTap);
      retryBtn?.removeEventListener("click", onRetry);
      resetBtn?.removeEventListener("click", onReset);
    },
  };
}

function parseOrbit(str) {
  const parts = str.split(" ").map((s) => s.trim());
  return [parts[0] || "auto", parts[1] || "auto", parts[2] || "auto"];
}
