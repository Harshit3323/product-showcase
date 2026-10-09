export function initVariants(viewer, config) {
  const container = document.getElementById('variants-container');
  if (!container || !config.variants?.length) {
    container?.classList.add('variants--hidden');
    return null;
  }

  let currentVariant = 0;

  function render() {
    container.innerHTML = '';
    config.variants.forEach((variant, index) => {
      const btn = document.createElement('button');
      btn.className = `variant-btn${index === currentVariant ? ' variant-btn--active' : ''}`;
      btn.setAttribute('aria-label', `${variant.name} variant`);
      btn.setAttribute('aria-pressed', index === currentVariant);
      btn.innerHTML = `
        <span class="variant-btn__swatch" style="background: ${variant.color}"></span>
        <span>${variant.name}</span>
      `;
      btn.addEventListener('click', () => selectVariant(index));
      container.appendChild(btn);
    });
  }

  function selectVariant(index) {
    if (index === currentVariant) return;
    currentVariant = index;

    const materials = viewer.model?.materials;
    if (materials) {
      const baseColor = config.variants[index].color;
      materials.forEach(mat => {
        if (mat.pbrMetallicRoughness?.baseColorFactor) {
          const hex = baseColor.replace('#', '');
          const r = parseInt(hex.slice(0, 2), 16) / 255;
          const g = parseInt(hex.slice(2, 4), 16) / 255;
          const b = parseInt(hex.slice(4, 6), 16) / 255;
          mat.pbrMetallicRoughness.baseColorFactor = [r, g, b, 1];
        }
      });
    }

    render();
  }

  function reset() {
    currentVariant = 0;
    render();
  }

  render();

  return {
    reset,
    destroy() {
      container.innerHTML = '';
    }
  };
}