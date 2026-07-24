(() => {
  'use strict';

  const viewer = document.querySelector('#mosaicTableViewer');
  if (!viewer) return;

  const colorButtons = [...document.querySelectorAll('.color-option')];
  const resetButton = document.querySelector('#resetProductCamera');
  const openArButton = document.querySelector('#openProductAR');
  const arError = document.querySelector('#productArError');
  const guide = document.querySelector('#arGuide');
  const guideStart = document.querySelector('#startProductAR');
  const guideClose = document.querySelector('#closeArGuide');
  const galleryButtons = [...document.querySelectorAll('[data-product-image]')];

  const DEFAULT_ORBIT = '35deg 68deg 1.35m';
  let activeColor = 'yellow';

  function setColor(button) {
    const model = button.dataset.model;
    const poster = button.dataset.poster;
    const color = button.dataset.color || 'yellow';
    if (!model) return;

    activeColor = color;
    viewer.src = model;
    if (poster) viewer.poster = poster;
    viewer.alt = `${color === 'green' ? 'Yeşil' : 'Sarı'} seramik mozaik kaplamalı el yapımı sehpanın üç boyutlu modeli`;

    colorButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });

    const title = document.querySelector('[data-active-color]');
    if (title) title.textContent = color === 'green' ? 'Yeşil' : 'Sarı';
  }

  colorButtons.forEach((button) => {
    button.addEventListener('click', () => setColor(button));
  });

  resetButton?.addEventListener('click', () => {
    viewer.cameraOrbit = DEFAULT_ORBIT;
    viewer.fieldOfView = '30deg';
    viewer.jumpCameraToGoal?.();
  });

  function showGuide() {
    if (guide) {
      guide.classList.add('show');
      guide.setAttribute('aria-hidden', 'false');
      guideStart?.focus();
    }
  }

  function hideGuide() {
    if (guide) {
      guide.classList.remove('show');
      guide.setAttribute('aria-hidden', 'true');
    }
  }

  async function launchAR() {
    try {
      const canActivate = await Promise.resolve(viewer.canActivateAR);
      if (!canActivate) {
        showGuide();
        const message = document.querySelector('#arGuideMessage');
        if (message) message.textContent = 'Bu cihaz doğrudan AR desteklemiyor olabilir. QR kodu AR destekli bir iPhone veya Android telefonla okutun.';
        return;
      }
      hideGuide();
      await viewer.activateAR();
    } catch (error) {
      console.warn('AR başlatılamadı:', error);
      arError?.classList.add('show');
      window.setTimeout(() => arError?.classList.remove('show'), 4200);
    }
  }

  openArButton?.addEventListener('click', () => {
    if (window.matchMedia('(pointer: coarse)').matches) launchAR();
    else showGuide();
  });
  guideStart?.addEventListener('click', launchAR);
  guideClose?.addEventListener('click', hideGuide);
  guide?.addEventListener('click', (event) => {
    if (event.target === guide) hideGuide();
  });

  viewer.addEventListener('ar-status', (event) => {
    if (event.detail?.status === 'failed') {
      arError?.classList.add('show');
      window.setTimeout(() => arError?.classList.remove('show'), 4200);
    }
  });

  galleryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      galleryButtons.forEach((item) => item.classList.toggle('active', item === button));
      const image = button.dataset.productImage;
      if (image) viewer.poster = image;
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('color') === 'green') {
    const green = colorButtons.find((button) => button.dataset.color === 'green');
    if (green) setColor(green);
  }

  if (params.get('ar') === '1') {
    window.setTimeout(() => {
      viewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showGuide();
    }, 850);
  }

  // Keep Scene Viewer and Quick Look on the currently selected real-size model.
  viewer.addEventListener('load', () => {
    viewer.setAttribute('ar-scale', 'fixed');
    viewer.setAttribute('ar-placement', 'floor');
  });
})();
