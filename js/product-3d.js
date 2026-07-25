(() => {
  'use strict';

  const viewer = document.querySelector('#mosaicTableViewer');
  if (!viewer) return;

  const colorButtons = [...document.querySelectorAll('.color-option[data-model]')];
  const resetButton = document.querySelector('#resetProductCamera');
  const openArButton = document.querySelector('#openProductAR');
  const arError = document.querySelector('#productArError');
  const quickLookLink = document.querySelector('#iosQuickLookLink');
  const directQuickLook = document.querySelector('#directQuickLook');
  const galleryButtons = [...document.querySelectorAll('[data-product-image]')];
  const loader = document.querySelector('#cinemaModelLoader');
  const stage = document.querySelector('#productCinemaStage');
  const cinemaSection = document.querySelector('.product-cinema-section');
  const arDock = document.querySelector('#cinemaArDock') || document.querySelector('.product-page-qr');
  const arState = document.querySelector('#cinemaArState') || document.querySelector('#arDiagnostic');

  const DEFAULT_ORBIT = viewer.getAttribute('camera-orbit') || '32deg 66deg 1.05m';
  const DEFAULT_TARGET = viewer.getAttribute('camera-target') || '0m 0.18m 0m';
  const DEFAULT_FOV = viewer.getAttribute('field-of-view') || '27deg';
  const ua = navigator.userAgent || '';
  const isiOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isInAppBrowser = /Instagram|FBAN|FBAV|Line\/|WhatsApp|TikTok|GSA\//i.test(ua);
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  let modelLoaded = Boolean(viewer.loaded);
  let dockTimer = 0;

  function withQuickLookOptions(url) {
    const clean = String(url || '').split('#')[0];
    return `${clean}#allowsContentScaling=0`;
  }

  function updateQuickLookLinks(usdz, poster) {
    if (!usdz) return;
    const href = withQuickLookOptions(usdz);
    [quickLookLink, directQuickLook].forEach((link) => {
      if (!link) return;
      link.href = href;
      const image = link.querySelector('img');
      if (image && poster) image.src = poster;
    });
    viewer.setAttribute('ios-src', usdz);
  }

  function updateActiveColorLabel(color) {
    const label = color === 'green' ? 'Yeşil' : 'Sarı';
    document.querySelectorAll('[data-active-color]').forEach((node) => {
      node.textContent = label;
    });
    cinemaSection?.setAttribute('data-product-color', color);
  }

  function setLoaderProgress(value) {
    if (!loader) return;
    const safeValue = Math.max(0, Math.min(1, Number(value) || 0));
    loader.style.setProperty('--model-progress', `${Math.round(safeValue * 100)}%`);
    loader.dataset.progress = String(Math.round(safeValue * 100));
  }

  function setColor(button) {
    const model = button.dataset.model;
    const usdz = button.dataset.usdz;
    const poster = button.dataset.poster;
    const color = button.dataset.color || 'yellow';
    if (!model) return;

    modelLoaded = false;
    loader?.classList.remove('is-ready');
    setLoaderProgress(0);
    viewer.pause?.();
    viewer.setAttribute('src', model);
    if (poster) viewer.setAttribute('poster', poster);
    updateQuickLookLinks(usdz, poster);
    viewer.alt = `${color === 'green' ? 'Yeşil' : 'Sarı'} seramik mozaik kaplamalı el yapımı orta sehpanın gerçek ölçülü üç boyutlu dijital ikizi`;

    colorButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });

    updateActiveColorLabel(color);
    setArState('3D DİJİTAL İKİZ YÜKLENİYOR');
  }

  function setArState(message) {
    if (arState) arState.textContent = message;
  }

  function showError(message) {
    if (!arError) return;
    arError.textContent = message;
    arError.classList.add('show');
    window.setTimeout(() => arError.classList.remove('show'), 6000);
  }

  function waitForModel(timeout = 12000) {
    if (viewer.loaded || modelLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        viewer.removeEventListener('load', done);
        reject(new Error('Model yükleme zaman aşımı'));
      }, timeout);
      const done = () => {
        window.clearTimeout(timer);
        resolve();
      };
      viewer.addEventListener('load', done, { once: true });
    });
  }

  function openNativeQuickLook() {
    const link = quickLookLink || directQuickLook;
    if (!link?.href) {
      showError('iPhone AR dosyası bulunamadı. Sayfayı yenileyip tekrar deneyin.');
      return false;
    }
    link.click();
    return true;
  }

  function highlightDesktopAR() {
    if (!arDock) {
      showError('AR deneyimi için bu sayfayı iPhone veya Android telefondan açın.');
      return;
    }
    arDock.classList.add('is-highlighted');
    arDock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.clearTimeout(dockTimer);
    dockTimer = window.setTimeout(() => arDock.classList.remove('is-highlighted'), 4200);
    setArState('QR KODU TELEFONLA OKUTUN · GERÇEK ÖLÇÜ HAZIR');
  }

  async function launchAR() {
    if (!window.isSecureContext && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      showError('Kamera özelliği yalnızca güvenli HTTPS bağlantısında çalışır.');
      return;
    }

    if (!(isiOS || isAndroid || isCoarse)) {
      highlightDesktopAR();
      return;
    }

    if (isiOS) {
      if (isInAppBrowser) {
        showError('Instagram veya WhatsApp içindeyseniz sayfayı Safari’de açın.');
      }
      setArState('APPLE QUICK LOOK AÇILIYOR · ZEMİNİ TARAYIN');
      openNativeQuickLook();
      return;
    }

    try {
      setArState('AR HAZIRLANIYOR · MODEL YÜKLENİYOR');
      await customElements.whenDefined('model-viewer');
      await waitForModel();
      await viewer.activateAR();
    } catch (error) {
      console.warn('AR başlatılamadı:', error);
      showError('Kamera modu başlatılamadı. Chrome izinlerini ve cihaz AR desteğini kontrol edin.');
      setArState('AR BAŞLATILAMADI · 3D MODELİ İNCELEYEBİLİRSİNİZ');
    }
  }

  colorButtons.forEach((button) => button.addEventListener('click', () => setColor(button)));

  resetButton?.addEventListener('click', () => {
    viewer.cameraOrbit = DEFAULT_ORBIT;
    viewer.cameraTarget = DEFAULT_TARGET;
    viewer.fieldOfView = DEFAULT_FOV;
    viewer.jumpCameraToGoal?.();
    setArState('GÖRÜNÜM SIFIRLANDI · SÜRÜKLEYEREK DÖNDÜRÜN');
  });

  openArButton?.addEventListener('click', launchAR);

  viewer.addEventListener('progress', (event) => {
    setLoaderProgress(event.detail?.totalProgress || 0);
  });

  viewer.addEventListener('load', () => {
    modelLoaded = true;
    viewer.setAttribute('ar-scale', 'fixed');
    viewer.setAttribute('ar-placement', 'floor');
    setLoaderProgress(1);
    window.setTimeout(() => loader?.classList.add('is-ready'), 240);
    setArState('CANLI 3D · PARMAKLA DÖNDÜRÜLEBİLİR');
  });

  viewer.addEventListener('error', (event) => {
    console.error('3D model yüklenemedi:', event);
    showError('3D model yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.');
    setArState('3D MODEL YÜKLENEMEDİ');
  });

  viewer.addEventListener('ar-status', (event) => {
    const status = event.detail?.status;
    if (status === 'session-started') setArState('AR AKTİF · ÜRÜN GERÇEK ÖLÇÜDE');
    if (status === 'object-placed') setArState('ÜRÜN ZEMİNE YERLEŞTİRİLDİ');
    if (status === 'failed') {
      showError('AR yüzey takibi başlatılamadı. Daha aydınlık ve boş bir zeminde tekrar deneyin.');
      setArState('AR YÜZEYİ ALGILAYAMADI');
    }
    if (status === 'not-presenting') setArState('CANLI 3D · PARMAKLA DÖNDÜRÜLEBİLİR');
  });

  galleryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      galleryButtons.forEach((item) => item.classList.toggle('active', item === button));
      const image = button.dataset.productImage;
      if (image) viewer.setAttribute('poster', image);
    });
  });

  // Subtle cinematic depth: the model remains fully interactive while the
  // surrounding typography responds to pointer movement.
  if (stage && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let frame = 0;
    stage.addEventListener('pointermove', (event) => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        stage.style.setProperty('--pointer-x', `${x}px`);
        stage.style.setProperty('--pointer-y', `${y}px`);
      });
    });
    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--pointer-x', '0px');
      stage.style.setProperty('--pointer-y', '0px');
    });
  }

  const params = new URLSearchParams(window.location.search);
  const requestedColor = params.get('color');
  const selected = colorButtons.find((button) => button.dataset.color === requestedColor)
    || colorButtons.find((button) => button.classList.contains('active'))
    || colorButtons[0];

  if (selected) {
    updateQuickLookLinks(selected.dataset.usdz, selected.dataset.poster);
    updateActiveColorLabel(selected.dataset.color || 'yellow');
  }

  if (params.get('ar') === '1') {
    window.setTimeout(() => {
      viewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (isiOS || isAndroid || isCoarse) {
        setArState('EVİNDE GÖR DÜĞMESİYLE KAMERAYI BAŞLATIN');
      } else {
        highlightDesktopAR();
      }
    }, 650);
  }
})();
