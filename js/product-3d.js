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
  const guideMessage = document.querySelector('#arGuideMessage');
  const diagnostic = document.querySelector('#arDiagnostic');
  const quickLookLink = document.querySelector('#iosQuickLookLink');
  const directQuickLook = document.querySelector('#directQuickLook');
  const galleryButtons = [...document.querySelectorAll('[data-product-image]')];

  const DEFAULT_ORBIT = '35deg 68deg 1.35m';
  const ua = navigator.userAgent || '';
  const isiOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  const isInAppBrowser = /Instagram|FBAN|FBAV|Line\/|WhatsApp|TikTok|GSA\//i.test(ua);
  let activeColor = 'yellow';
  let modelLoaded = Boolean(viewer.loaded);

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

  function setColor(button) {
    const model = button.dataset.model;
    const usdz = button.dataset.usdz;
    const poster = button.dataset.poster;
    const color = button.dataset.color || 'yellow';
    if (!model) return;

    activeColor = color;
    modelLoaded = false;
    viewer.src = model;
    if (poster) viewer.poster = poster;
    updateQuickLookLinks(usdz, poster);
    viewer.alt = `${color === 'green' ? 'Yeşil' : 'Sarı'} seramik mozaik kaplamalı el yapımı sehpanın gerçek yüzey dokulu üç boyutlu modeli`;

    colorButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });

    const title = document.querySelector('[data-active-color]');
    if (title) title.textContent = color === 'green' ? 'Yeşil' : 'Sarı';
    updateDiagnostic();
  }

  colorButtons.forEach((button) => button.addEventListener('click', () => setColor(button)));

  resetButton?.addEventListener('click', () => {
    viewer.cameraOrbit = DEFAULT_ORBIT;
    viewer.fieldOfView = '30deg';
    viewer.jumpCameraToGoal?.();
  });

  function showGuide(message) {
    if (message && guideMessage) guideMessage.textContent = message;
    if (guide) {
      guide.classList.add('show');
      guide.setAttribute('aria-hidden', 'false');
      directQuickLook?.classList.toggle('show', isiOS);
      updateDiagnostic();
      guideStart?.focus();
    }
  }

  function hideGuide() {
    if (guide) {
      guide.classList.remove('show');
      guide.setAttribute('aria-hidden', 'true');
    }
  }

  function showError(message) {
    if (arError) {
      arError.textContent = message;
      arError.classList.add('show');
      window.setTimeout(() => arError.classList.remove('show'), 5600);
    }
  }

  function waitForModel(timeout = 9000) {
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
    // Apple recommends a direct user-initiated <a rel="ar"> handoff to USDZ.
    link.click();
    return true;
  }

  async function launchAR() {
    if (!window.isSecureContext && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      showError('Kamera özelliği yalnızca güvenli HTTPS bağlantısında çalışır.');
      return;
    }

    // Keep the Apple Quick Look handoff inside the original tap event. Waiting
    // for any promise first can cause Safari to discard the required user gesture.
    if (isiOS) {
      if (isInAppBrowser && guideMessage) {
        guideMessage.textContent = 'Bu bağlantı Instagram veya WhatsApp içinden açıldı. AR açılmazsa sağ üst menüden “Safari’de Aç” seçeneğini kullanın.';
      }
      openNativeQuickLook();
      return;
    }

    try {
      await customElements.whenDefined('model-viewer');
      await waitForModel();
      hideGuide();
      await viewer.activateAR();
    } catch (error) {
      console.warn('AR başlatılamadı:', error);
      if (isiOS && openNativeQuickLook()) return;
      showError('Kamera modu başlatılamadı. Tarayıcı izinlerini kontrol edin veya sayfayı Safari/Chrome ile açın.');
      showGuide();
    }
  }

  function updateDiagnostic() {
    if (!diagnostic) return;
    const mode = isiOS ? 'iPhone / Apple Quick Look' : 'Android / WebXR veya Scene Viewer';
    const browser = isInAppBrowser ? 'uygulama içi tarayıcı' : (isSafari ? 'Safari' : 'standart tarayıcı');
    const secure = window.isSecureContext ? 'HTTPS hazır' : 'HTTPS gerekli';
    const loaded = viewer.loaded || modelLoaded ? 'model yüklendi' : 'model yükleniyor';
    const capability = typeof viewer.canActivateAR === 'boolean' ? `AR tahmini: ${viewer.canActivateAR ? 'uygun' : 'belirsiz'}` : 'AR tahmini bekleniyor';
    diagnostic.textContent = `${mode} · ${browser} · ${secure} · ${loaded} · ${capability}`;
  }

  openArButton?.addEventListener('click', () => {
    if (window.matchMedia('(pointer: coarse)').matches || isiOS) {
      showGuide(isiOS
        ? 'Kamerayı açtığınızda telefonu zemine tutun. Ürün, gerçek ölçüsüyle Apple Quick Look içinde yerleştirilecektir.'
        : 'Kamera açıldığında telefonu zemine tutun ve yüzey algılanana kadar yavaşça hareket ettirin.');
    } else {
      showGuide('Bilgisayardan bakıyorsunuz. QR kodu telefonunuzla okutun; telefonda açılan sayfada kamerayı başlatın.');
    }
  });
  guideStart?.addEventListener('click', launchAR);
  directQuickLook?.addEventListener('click', () => {
    // Keep href navigation native. Closing the guide avoids a stale overlay on return.
    window.setTimeout(hideGuide, 250);
  });
  guideClose?.addEventListener('click', hideGuide);
  guide?.addEventListener('click', (event) => {
    if (event.target === guide) hideGuide();
  });

  viewer.addEventListener('load', () => {
    modelLoaded = true;
    viewer.setAttribute('ar-scale', 'fixed');
    viewer.setAttribute('ar-placement', 'floor');
    updateDiagnostic();
  });

  // ar-status is emitted for WebXR; Quick Look is a native hand-off and does
  // not report its state back to the webpage.
  viewer.addEventListener('ar-status', (event) => {
    if (event.detail?.status === 'failed') {
      showError('AR yüzey takibi başlatılamadı. Daha aydınlık bir zeminde tekrar deneyin.');
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
  } else {
    const selected = colorButtons.find((button) => button.classList.contains('active')) || colorButtons[0];
    if (selected) updateQuickLookLinks(selected.dataset.usdz, selected.dataset.poster);
  }

  if (params.get('ar') === '1') {
    window.setTimeout(() => {
      viewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showGuide(isiOS
        ? 'Ürün hazır. “Kamerayı Aç ve Başlat” düğmesine dokunarak Apple Quick Look ile odanıza yerleştirin.'
        : 'Ürün hazır. Kamerayı başlatıp zemini yavaşça tarayın.');
    }, 850);
  }

  updateDiagnostic();
})();
