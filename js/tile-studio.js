(() => {
  'use strict';

  const app = document.querySelector('#tileStudioApp');
  if (!app) return;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const cameraInput = $('#cameraInput');
  const galleryInput = $('#galleryInput');
  const takePhotoButton = $('#takePhotoButton');
  const choosePhotoButton = $('#choosePhotoButton');
  const changePhotoButton = $('#changePhotoButton');
  const photoUploader = $('#photoUploader');
  const uploadEmpty = $('#uploadEmpty');
  const uploadPreview = $('#uploadPreview');
  const imageProcessing = $('#imageProcessing');
  const sourcePreview = $('#sourcePreview');
  const photoMeta = $('#photoMeta');

  const modeButtons = $$('[data-mode]');
  const surfaceButtons = $$('[data-surface]');
  const materialButtons = $$('.material-option[data-material]');
  const customColorOption = $('#customColorOption');
  const customTileColor = $('#customTileColor');
  const tileSize = $('#tileSize');
  const customSizeFields = $('#customSizeFields');
  const customTileWidth = $('#customTileWidth');
  const customTileHeight = $('#customTileHeight');
  const layoutPattern = $('#layoutPattern');
  const groutColor = $('#groutColor');
  const groutWidth = $('#groutWidth');
  const customGroutField = $('#customGroutField');
  const customGroutColor = $('#customGroutColor');
  const finishButtons = $$('[data-finish]');
  const surfaceControlSections = $('#surfaceControlSections');
  const productControlSections = $('#productControlSections');
  const productButtons = $$('.product-option[data-product]');
  const selectedProductPreview = $('#selectedProductPreview');
  const selectedProductName = $('#selectedProductName');
  const selectedProductDescription = $('#selectedProductDescription');
  const selectedProductSpecs = $('#selectedProductSpecs');

  const designSummary = $('#designSummary');
  const designDetail = $('#designDetail');
  const privacyConsent = $('#privacyConsent');
  const renderButton = $('#renderDesign');
  const renderStatusSection = $('#renderStatusSection');
  const renderStatusTitle = $('#renderStatusTitle');
  const renderStatusText = $('#renderStatusText');
  const resultSection = $('#resultSection');
  const beforeImage = $('#beforeImage');
  const afterImage = $('#afterImage');
  const afterWrap = $('#afterWrap');
  const compareRange = $('#compareRange');
  const compareDivider = $('#compareDivider');
  const resultSummary = $('#resultSummary');
  const resultDetail = $('#resultDetail');
  const downloadResult = $('#downloadResult');
  const redesignButton = $('#redesignButton');
  const whatsappResult = $('#whatsappResult');
  const toast = $('#studioToast');

  const MAX_SOURCE_BYTES = 32 * 1024 * 1024;
  const TARGET_UPLOAD_BYTES = 2.7 * 1024 * 1024;
  const MAX_IMAGE_EDGE = 1800;
  const REQUEST_TIMEOUT_MS = 210000;
  const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

  const materialLabels = {
    calacatta: 'Calacatta',
    travertine: 'Traverten',
    sage: 'Adaçayı',
    ocean: 'Okyanus',
    graphite: 'Grafit',
    terracotta: 'Terakota',
    mustard: 'Hardal',
    custom: 'Özel Renk'
  };

  const patternLabels = {
    straight: 'Düz',
    horizontal: 'Yatay',
    vertical: 'Dikey',
    staggered: 'Şaşırtmalı',
    herringbone: 'Balıksırtı',
    diagonal: 'Çapraz'
  };

  const finishLabels = { matte: 'Mat', glossy: 'Parlak' };

  const products = {
    'tv-unit': {
      slug: 'tv-unit',
      name: 'Seramik TV Ünitesi',
      summary: 'TV Ünitesi',
      description: 'Yapay zekâ, ürünü fotoğrafınızdaki uygun duvar veya yaşam alanına doğal ışık ve perspektifle yerleştirir.',
      specs: '142 × 42 × 47h cm · 90 kg · Seramik kaplama · Ahşap iç iskelet',
      whatsapp: 'Seramik TV Ünitesi',
      referenceImages: [
        'images/products/tv-unit-standalone.webp',
        'images/products/tv-unit-detail.webp'
      ],
      previewImage: 'images/products/tv-unit-lifestyle.webp',
      placementHint: 'Find the existing TV console, media cabinet or low unit directly beneath the television and replace ONLY that furniture item with the referenced Yanar TV unit. The television is protected and must remain exactly where it is, at the same size, angle and screen content. Preserve speakers, soundbar, game console, cables, plants, framed photos, books, ornaments and every object that was on or beside the old TV unit; place the same objects back on or beside the new unit in the same relative positions. If there is no existing TV console, place the new unit beneath the existing TV without removing or moving anything else.',
      replacementPolicy: 'Replace only the existing TV console or media cabinet beneath the TV. Protect the television and all surrounding objects.'
    },
    'console-green': {
      slug: 'console-green',
      name: 'Seramik Dresuar',
      summary: 'Dresuar',
      description: 'Yapay zekâ, ürünü giriş, koridor veya duvar önünde doğal bir konsol yerleşimiyle gösterir.',
      specs: '81 × 28 × 91h cm · 40 kg · Seramik / Cam Mozaik · Ahşap iç iskelet',
      whatsapp: 'Seramik Dresuar',
      referenceImages: [
        'images/products/console-green-standalone.webp',
        'images/products/console-green-detail.webp'
      ],
      previewImage: 'images/products/console-green-lifestyle.webp',
      placementHint: 'Find an existing console, dresser or narrow sideboard in the room and replace ONLY that furniture item with the referenced Yanar console. Preserve every mirror, artwork, lamp, vase, book, tray, plant and decorative object that was on or above the old console; put those exact objects back on or above the new console in the same relative positions. If there is no matching console, place the new console in a clearly empty wall area without removing or moving any existing object.',
      replacementPolicy: 'Replace only an existing console/dresser; preserve all objects on and around it.'
    },
    'console-cream': {
      slug: 'console-cream',
      name: 'Krem Seramik Dresuar',
      summary: 'Krem Dresuar',
      description: 'Yapay zekâ, açık krem seramik yüzeyli dresuarı giriş, koridor veya duvar önünde doğal bir konsol yerleşimiyle gösterir.',
      specs: '81 × 28 × 91h cm · 45 kg · Seramik / Cam Mozaik · Ahşap iç iskelet',
      whatsapp: 'Krem Seramik Dresuar',
      referenceImages: [
        'images/products/console-cream-lifestyle.webp',
        'images/products/console-cream-detail.webp'
      ],
      previewImage: 'images/products/console-cream-angle.webp',
      placementHint: 'Find an existing console, dresser or narrow sideboard in the room and replace ONLY that furniture item with the referenced cream Yanar console. Preserve every mirror, artwork, lamp, vase, book, tray, plant and decorative object that was on or above the old console; put those exact objects back on or above the new console in the same relative positions. If there is no matching console, place the new console in a clearly empty wall area without removing or moving any existing object.',
      replacementPolicy: 'Replace only an existing console/dresser; preserve all objects on and around it.'
    },
    'table-blue': {
      slug: 'table-blue',
      name: 'Seramik Masa',
      summary: 'Masa',
      description: 'Yapay zekâ, ürünü oda merkezine veya uygun yemek alanına gerçek ölçek hissiyle yerleştirir.',
      specs: '91 × 91 × 76h cm · 70 kg · Seramik kaplama · Ahşap iç iskelet',
      whatsapp: 'Seramik Masa',
      referenceImages: [
        'images/products/table-blue-standalone.webp',
        'images/products/table-blue-detail.webp'
      ],
      previewImage: 'images/products/table-blue-lifestyle.webp',
      placementHint: 'Find the existing dining table or square table and replace ONLY that table with the referenced Yanar table. Preserve all chairs exactly, including their number, position and design. Preserve every object on the old tabletop such as books, bowls, glasses, flowers, candles and tableware; place the same objects back on the new tabletop in the same relative positions. If no matching table exists, place the new table only in a clearly empty dining area and do not remove any furniture.',
      replacementPolicy: 'Replace only the existing table; preserve chairs and all tabletop objects.'
    },
    'nightstand-green': {
      slug: 'nightstand-green',
      name: 'Seramik / Cam Mozaik Komidin',
      summary: 'Komidin',
      description: 'Yapay zekâ, ürünü yatak yanında veya uygun küçük bir yan mobilya alanında gösterir.',
      specs: '38 × 38 × 54h cm · 40 kg · Seramik / Cam Mozaik · Ahşap iç iskelet',
      whatsapp: 'Seramik / Cam Mozaik Komidin',
      referenceImages: [
        'images/products/nightstand-green-standalone.webp',
        'images/products/nightstand-green-open.webp'
      ],
      previewImage: 'images/products/nightstand-green-lifestyle.webp',
      placementHint: 'Find the existing bedside table or small side cabinet and replace ONLY that furniture item with the referenced Yanar nightstand. Preserve the bed, headboard, lamp, books, charger, clock, glass, decorations and every object that was on or beside the old nightstand; place the same objects back on or beside the new nightstand in the same relative positions. If no matching nightstand exists, place the new product in an empty bedside area without moving anything else.',
      replacementPolicy: 'Replace only the existing nightstand/side cabinet; preserve bed, lamp and all small objects.'
    },
    'mosaic-coffee-table': {
      slug: 'mosaic-coffee-table',
      name: 'Mozaik Orta Sehpa',
      summary: 'Mozaik Sehpa',
      description: 'Yapay zekâ, 3D + AR’de yer alan ürünü fotoğrafınızdaki yaşam alanına sehpa olarak ekler.',
      specs: '81 × 49 × 38h cm · 40 kg · Seramik / Cam Mozaik · Ahşap iç iskelet',
      whatsapp: 'Mozaik Orta Sehpa',
      referenceImages: [
        'images/products/mosaic-table-green-spec.webp',
        'images/products/mosaic-table-green-detail.webp'
      ],
      previewImage: 'images/products/mosaic-table-green-room.webp',
      placementHint: 'Find the existing coffee table or center table and replace ONLY that furniture item with the referenced Yanar coffee table. Preserve sofas, armchairs, rugs and their exact positions. Preserve every book, tray, vase, glass, remote, candle and decorative object on the old table; place the same objects back on the new table in the same relative positions. If there is no existing coffee table, place the new product only in a clearly empty area in front of the seating without removing anything.',
      replacementPolicy: 'Replace only the existing coffee table; preserve seating, rug and all tabletop objects.'
    }
  };

  const state = {
    file: null,
    sourceUrl: '',
    resultDataUrl: '',
    mode: 'surface',
    selectedProduct: 'tv-unit',
    surface: 'wall',
    material: 'calacatta',
    customTileColor: '#4d8d82',
    finish: 'matte',
    rendering: false
  };

  let toastTimer = 0;
  let statusTimer = 0;

  function showToast(message, duration = 5200) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), duration);
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }

  function getTileSizeLabel() {
    if (tileSize.value !== 'custom') return `${tileSize.value.replace('x', ' × ')} cm`;
    const width = Math.max(2, Math.min(300, Number(customTileWidth.value) || 40));
    const height = Math.max(2, Math.min(300, Number(customTileHeight.value) || 80));
    return `${String(width).replace('.', ',')} × ${String(height).replace('.', ',')} cm`;
  }

  function getGroutLabel() {
    const selected = groutColor.options[groutColor.selectedIndex];
    if (groutColor.value === 'custom') return `Özel Renk (${customGroutColor.value.toUpperCase()})`;
    return selected?.dataset.label || selected?.textContent || 'Kırık Beyaz';
  }

  function getMaterialLabel() {
    if (state.material === 'custom') return `Özel Renk (${state.customTileColor.toUpperCase()})`;
    return materialLabels[state.material] || 'Calacatta';
  }

  function getCurrentProduct() {
    return products[state.selectedProduct] || products['tv-unit'];
  }

  function getSelection() {
    if (state.mode === 'product') {
      const product = getCurrentProduct();
      return {
        mode: 'product',
        productSlug: product.slug,
        productName: product.name,
        productSummary: product.summary,
        productDescription: product.description,
        productSpecs: product.specs,
        placementHint: product.placementHint,
        replacementPolicy: product.replacementPolicy,
        referenceImages: product.referenceImages
      };
    }

    return {
      mode: 'surface',
      surface: state.surface,
      surfaceLabel: state.surface === 'floor' ? 'Zemin' : 'Duvar',
      material: state.material,
      materialLabel: getMaterialLabel(),
      customTileColor: state.customTileColor,
      tileSize: tileSize.value,
      tileSizeLabel: getTileSizeLabel(),
      customTileWidth: customTileWidth.value,
      customTileHeight: customTileHeight.value,
      pattern: layoutPattern.value,
      patternLabel: patternLabels[layoutPattern.value] || 'Düz',
      finish: state.finish,
      finishLabel: finishLabels[state.finish] || 'Mat',
      groutColor: groutColor.value,
      groutColorLabel: getGroutLabel(),
      customGroutColor: customGroutColor.value,
      groutWidth: String(Math.max(1, Math.min(12, Number(groutWidth.value) || 3)))
    };
  }

  function updateActionLabel() {
    if (state.rendering) return;
    renderButton.innerHTML = state.mode === 'product'
      ? '<svg><use href="#i-spark"></use></svg> Ürünü Mekânıma Yerleştir'
      : '<svg><use href="#i-spark"></use></svg> Mekânımı Tasarla';
  }

  function updateProductUI() {
    const product = getCurrentProduct();
    productButtons.forEach((button) => button.classList.toggle('active', button.dataset.product === product.slug));
    if (selectedProductPreview) selectedProductPreview.src = product.previewImage;
    if (selectedProductName) selectedProductName.textContent = product.name;
    if (selectedProductDescription) selectedProductDescription.textContent = product.description;
    if (selectedProductSpecs) selectedProductSpecs.textContent = product.specs;
  }

  function updateModeUI() {
    const isProduct = state.mode === 'product';
    surfaceControlSections.hidden = isProduct;
    productControlSections.hidden = !isProduct;
    modeButtons.forEach((button) => button.classList.toggle('active', button.dataset.mode === state.mode));
    updateProductUI();
    updateActionLabel();
  }

  function updateSummary() {
    if (state.mode === 'product') {
      const product = getCurrentProduct();
      designSummary.textContent = `${product.name} · Yapay zekâ yerleşimi`;
      designDetail.textContent = product.specs;
      updateModeUI();
      return;
    }

    const selection = getSelection();
    designSummary.textContent = `${selection.materialLabel} · ${selection.tileSizeLabel} · ${selection.patternLabel}`;
    designDetail.textContent = `${selection.surfaceLabel} · ${selection.finishLabel} yüzey · ${selection.groutColorLabel}, ${selection.groutWidth.replace('.', ',')} mm derz`;
    updateModeUI();
  }

  function updateRenderAvailability() {
    renderButton.disabled = !state.file || !privacyConsent.checked || state.rendering;
  }

  function setProcessing(active) {
    imageProcessing.hidden = !active;
    if (active) {
      uploadEmpty.hidden = true;
      uploadPreview.hidden = true;
    }
  }

  function revokeSourceUrl() {
    if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
    state.sourceUrl = '';
  }

  async function loadImageSource(file) {
    if ('createImageBitmap' in window) {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return {
          width: bitmap.width,
          height: bitmap.height,
          draw(context, width, height) { context.drawImage(bitmap, 0, 0, width, height); },
          close() { bitmap.close?.(); }
        };
      } catch (_) {
        // Fallback below.
      }
    }

    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
        element.src = url;
      });
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        draw(context, width, height) { context.drawImage(image, 0, 0, width, height); },
        close() { URL.revokeObjectURL(url); }
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }

  function canvasToBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('IMAGE_ENCODE_FAILED')), 'image/jpeg', quality);
    });
  }

  async function compressImage(file) {
    if (!SUPPORTED_TYPES.has(file.type)) throw new Error('UNSUPPORTED_FILE');
    if (file.size > MAX_SOURCE_BYTES) throw new Error('SOURCE_TOO_LARGE');

    const source = await loadImageSource(file);
    try {
      if (!source.width || !source.height || source.width < 40 || source.height < 40) throw new Error('IMAGE_DECODE_FAILED');

      let scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(source.width, source.height));
      let width = Math.max(1, Math.round(source.width * scale));
      let height = Math.max(1, Math.round(source.height * scale));
      let quality = 0.88;
      let blob = null;

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('CANVAS_UNSUPPORTED');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        source.draw(context, width, height);
        blob = await canvasToBlob(canvas, quality);

        if (blob.size <= TARGET_UPLOAD_BYTES) break;
        if (quality > 0.63) {
          quality -= 0.08;
        } else {
          width = Math.max(720, Math.round(width * 0.84));
          height = Math.max(720, Math.round(height * 0.84));
          quality = 0.78;
        }
      }

      if (!blob || blob.size > 3.2 * 1024 * 1024) throw new Error('COMPRESSED_TOO_LARGE');
      return new File([blob], 'yanar-seramik-mekan.jpg', { type: 'image/jpeg', lastModified: Date.now() });
    } finally {
      source.close();
    }
  }

  function fileErrorMessage(error) {
    switch (error?.message) {
      case 'UNSUPPORTED_FILE': return 'Bu dosya türü desteklenmiyor. Lütfen JPG, PNG veya WebP fotoğraf seçin.';
      case 'SOURCE_TOO_LARGE': return 'Fotoğraf çok büyük. Lütfen 32 MB’den küçük bir fotoğraf seçin.';
      case 'COMPRESSED_TOO_LARGE': return 'Fotoğraf güvenli yükleme boyutuna indirilemedi. Daha düşük çözünürlüklü başka bir fotoğraf deneyin.';
      case 'IMAGE_DECODE_FAILED': return 'Fotoğraf okunamadı. HEIC yerine JPG, PNG veya WebP formatında tekrar deneyin.';
      case 'CANVAS_UNSUPPORTED': return 'Tarayıcınız fotoğraf küçültmeyi desteklemiyor. Güncel Safari veya Chrome ile tekrar deneyin.';
      default: return 'Fotoğraf hazırlanırken bir sorun oluştu. Başka bir fotoğrafla tekrar deneyin.';
    }
  }

  async function handleSelectedFile(file) {
    if (!file) return;
    setProcessing(true);
    resultSection.hidden = true;

    try {
      const compressed = await compressImage(file);
      revokeSourceUrl();
      state.file = compressed;
      state.sourceUrl = URL.createObjectURL(compressed);
      sourcePreview.src = state.sourceUrl;
      photoMeta.textContent = `${formatBytes(compressed.size)} · Tasarım için hazır`;
      uploadEmpty.hidden = true;
      uploadPreview.hidden = false;
      showToast(file.size > compressed.size ? `Fotoğraf ${formatBytes(file.size)} boyutundan ${formatBytes(compressed.size)} boyutuna küçültüldü.` : 'Fotoğraf tasarım için hazır.');
    } catch (error) {
      console.error('Fotoğraf hazırlama hatası:', error);
      state.file = null;
      uploadEmpty.hidden = false;
      uploadPreview.hidden = true;
      showToast(fileErrorMessage(error), 7200);
    } finally {
      setProcessing(false);
      if (state.file) {
        uploadEmpty.hidden = true;
        uploadPreview.hidden = false;
      } else {
        uploadEmpty.hidden = false;
      }
      cameraInput.value = '';
      galleryInput.value = '';
      updateRenderAvailability();
    }
  }

  takePhotoButton.addEventListener('click', () => cameraInput.click());
  choosePhotoButton.addEventListener('click', () => galleryInput.click());
  changePhotoButton.addEventListener('click', () => galleryInput.click());
  cameraInput.addEventListener('change', () => handleSelectedFile(cameraInput.files?.[0]));
  galleryInput.addEventListener('change', () => handleSelectedFile(galleryInput.files?.[0]));

  ['dragenter', 'dragover'].forEach((eventName) => photoUploader.addEventListener(eventName, (event) => {
    event.preventDefault();
    photoUploader.classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach((eventName) => photoUploader.addEventListener(eventName, (event) => {
    event.preventDefault();
    photoUploader.classList.remove('is-dragging');
  }));
  photoUploader.addEventListener('drop', (event) => handleSelectedFile(event.dataTransfer?.files?.[0]));

  modeButtons.forEach((button) => button.addEventListener('click', () => {
    state.mode = button.dataset.mode === 'product' ? 'product' : 'surface';
    updateSummary();
    updateRenderAvailability();
  }));

  productButtons.forEach((button) => button.addEventListener('click', () => {
    state.selectedProduct = button.dataset.product || 'tv-unit';
    updateSummary();
  }));

  surfaceButtons.forEach((button) => button.addEventListener('click', () => {
    state.surface = button.dataset.surface === 'floor' ? 'floor' : 'wall';
    surfaceButtons.forEach((item) => item.classList.toggle('active', item === button));
    updateSummary();
  }));

  materialButtons.forEach((button) => button.addEventListener('click', () => {
    state.material = button.dataset.material;
    materialButtons.forEach((item) => item.classList.toggle('active', item === button));
    customColorOption.classList.remove('active');
    updateSummary();
  }));

  customColorOption.addEventListener('click', () => {
    state.material = 'custom';
    materialButtons.forEach((item) => item.classList.remove('active'));
    customColorOption.classList.add('active');
    updateSummary();
  });

  customTileColor.addEventListener('input', () => {
    state.material = 'custom';
    state.customTileColor = customTileColor.value;
    customColorOption.querySelector('i').style.background = customTileColor.value;
    materialButtons.forEach((item) => item.classList.remove('active'));
    customColorOption.classList.add('active');
    updateSummary();
  });

  tileSize.addEventListener('change', () => {
    customSizeFields.hidden = tileSize.value !== 'custom';
    updateSummary();
  });
  [customTileWidth, customTileHeight, layoutPattern, groutWidth].forEach((element) => element.addEventListener('input', updateSummary));

  groutColor.addEventListener('change', () => {
    customGroutField.hidden = groutColor.value !== 'custom';
    updateSummary();
  });
  customGroutColor.addEventListener('input', updateSummary);

  finishButtons.forEach((button) => button.addEventListener('click', () => {
    state.finish = button.dataset.finish === 'glossy' ? 'glossy' : 'matte';
    finishButtons.forEach((item) => item.classList.toggle('active', item === button));
    updateSummary();
  }));

  privacyConsent.addEventListener('change', updateRenderAvailability);

  function apiErrorMessage(status, payload) {
    const code = payload?.code || payload?.error?.code;
    if (code === 'MISSING_API_KEY' || code === 'INVALID_API_KEY') return 'Yapay zekâ stüdyosu geçici olarak kullanılamıyor. Lütfen kısa süre sonra yeniden deneyin.';
    if (code === 'ORG_VERIFICATION_REQUIRED') return 'Yapay zekâ stüdyosunun OpenAI hesap doğrulaması tamamlanmamış. Lütfen kısa süre sonra yeniden deneyin.';
    if (code === 'KEY_PERMISSION_DENIED') return 'Yapay zekâ stüdyosunun sunucu izni eksik. Lütfen kısa süre sonra yeniden deneyin.';
    if (code === 'OPENAI_BILLING' || status === 402) return 'Yapay zekâ stüdyosunun kullanım limiti dolmuş. Lütfen kısa süre sonra yeniden deneyin.';
    if (code === 'PAYLOAD_TOO_LARGE' || status === 413) return 'Fotoğraf istek sınırını aşıyor. Daha düşük çözünürlüklü bir fotoğraf seçin.';
    if (code === 'UNSUPPORTED_FILE' || status === 415) return 'Bu dosya türü desteklenmiyor. JPG, PNG veya WebP kullanın.';
    if (code === 'TIMEOUT' || status === 504) return 'Tasarım işlemi zaman aşımına uğradı. Aynı fotoğrafla yeniden deneyin.';
    if (code === 'RATE_LIMIT' || status === 429) return 'Şu anda çok fazla tasarım isteği var. Kısa süre sonra yeniden deneyin.';
    if (code === 'CONTENT_REJECTED') return 'Fotoğraf güvenlik kontrolleri nedeniyle işlenemedi. Farklı bir mekân fotoğrafı deneyin.';
    if (code === 'MODEL_UNAVAILABLE') return 'Yapay zekâ görüntü modeli bu projede henüz etkin değil. Lütfen kısa süre sonra yeniden deneyin.';
    return payload?.message || payload?.error?.message || 'Tasarım oluşturulamadı. Lütfen tekrar deneyin.';
  }

  function startStatusMessages() {
    const messages = state.mode === 'product'
      ? [
          ['Ürün yerleşimi hazırlanıyor', 'Yapay zekâ mekân fotoğrafını analiz ediyor ve uygun perspektifi belirliyor.'],
          ['Ürün kimliği işleniyor', 'Gönderdiğiniz gerçek ürün referansları korunarak doğru siluet ve yüzey hazırlanıyor.'],
          ['Mekâna yerleştiriliyor', 'Seçili ürün doğal gölge, ölçek ve konumla iç mekâna ekleniyor.'],
          ['Son dokunuşlar yapılıyor', 'Perspektif, ışık ve kenar uyumu düzeltilerek sonuç hazırlanıyor.']
        ]
      : [
          ['Mekânınız tasarlanıyor', 'Yapay zekâ mimari detayları koruyarak fotoğrafı analiz ediyor.'],
          ['Yüzey sınırları belirleniyor', `Seçilen ${state.surface === 'floor' ? 'zemin' : 'duvar'} alanı perspektife göre hazırlanıyor.`],
          ['Seramik uygulanıyor', 'Ölçü, döşeme, yüzey ve derz seçimleri fotogerçekçi olarak işleniyor.'],
          ['Son dokunuşlar yapılıyor', 'Işık, gölge, yansıma ve mevcut eşyalar korunarak sonuç hazırlanıyor.']
        ];

    let index = 0;
    renderStatusTitle.textContent = messages[0][0];
    renderStatusText.textContent = messages[0][1];
    window.clearInterval(statusTimer);
    statusTimer = window.setInterval(() => {
      index = Math.min(index + 1, messages.length - 1);
      renderStatusTitle.textContent = messages[index][0];
      renderStatusText.textContent = messages[index][1];
    }, 12000);
  }

  function stopStatusMessages() {
    window.clearInterval(statusTimer);
    statusTimer = 0;
  }

  function setRendering(active) {
    state.rendering = active;
    renderStatusSection.hidden = !active;
    renderButton.innerHTML = active
      ? '<span class="studio-spinner" aria-hidden="true"></span> Tasarlanıyor…'
      : (state.mode === 'product'
          ? '<svg><use href="#i-spark"></use></svg> Ürünü Mekânıma Yerleştir'
          : '<svg><use href="#i-spark"></use></svg> Mekânımı Tasarla');
    updateRenderAvailability();
    if (active) {
      startStatusMessages();
      renderStatusSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      stopStatusMessages();
    }
  }

  function configureResult(selection, imageBase64, mimeType = 'image/jpeg') {
    state.resultDataUrl = `data:${mimeType};base64,${imageBase64}`;
    beforeImage.src = state.sourceUrl;
    afterImage.src = state.resultDataUrl;

    if (selection.mode === 'product') {
      resultSummary.textContent = `${selection.productName} · Yerleşim önizlemesi`;
      resultDetail.textContent = selection.productSpecs;
      const whatsappText = [
        'Merhaba Yanar Seramik, Yapay Zekâ Stüdyosu’nda hazırladığım ürün yerleşimi için bilgi almak istiyorum.',
        '',
        `Ürün: ${selection.productName}`,
        `Ölçü / özellik: ${selection.productSpecs}`,
        '',
        'Oluşan tasarım görselini bu görüşmeye ayrıca ekleyeceğim.'
      ].join('\n');
      whatsappResult.href = `https://wa.me/905438964440?text=${encodeURIComponent(whatsappText)}`;
    } else {
      resultSummary.textContent = `${selection.materialLabel} · ${selection.tileSizeLabel}`;
      resultDetail.textContent = `${selection.surfaceLabel} · ${selection.patternLabel} · ${selection.finishLabel} yüzey · ${selection.groutColorLabel}, ${selection.groutWidth.replace('.', ',')} mm derz`;
      const whatsappText = [
        'Merhaba Yanar Seramik, Yapay Zekâ Seramik Stüdyosu’nda hazırladığım tasarım için teklif almak istiyorum.',
        '',
        `Uygulama yüzeyi: ${selection.surfaceLabel}`,
        `Seramik: ${selection.materialLabel}`,
        `Ölçü: ${selection.tileSizeLabel}`,
        `Döşeme: ${selection.patternLabel}`,
        `Yüzey: ${selection.finishLabel}`,
        `Derz: ${selection.groutColorLabel} / ${selection.groutWidth.replace('.', ',')} mm`,
        '',
        'Oluşan tasarım görselini bu görüşmeye ayrıca ekleyeceğim.'
      ].join('\n');
      whatsappResult.href = `https://wa.me/905438964440?text=${encodeURIComponent(whatsappText)}`;
    }

    resultSection.hidden = false;
    compareRange.value = '50';
    updateComparison(50);
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function fetchReferenceFile(url, filename) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error('REFERENCE_FETCH_FAILED');
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/webp' });
  }

  async function renderDesign() {
    if (!state.file) {
      showToast('Önce mekân fotoğrafınızı çekin veya galeriden seçin.');
      return;
    }
    if (!privacyConsent.checked) {
      showToast('Devam etmek için gizlilik ve açık onay kutusunu işaretleyin.');
      return;
    }

    const selection = getSelection();
    const formData = new FormData();
    formData.append('image', state.file, state.file.name);
    formData.append('mode', selection.mode);

    if (selection.mode === 'product') {
      formData.append('productSlug', selection.productSlug);
      formData.append('productName', selection.productName);
      formData.append('productDescription', selection.productDescription);
      formData.append('productSpecs', selection.productSpecs);
      formData.append('placementHint', selection.placementHint);
      formData.append('replacementPolicy', selection.replacementPolicy || '');

      try {
        const referenceFiles = await Promise.all(selection.referenceImages.map((url, index) => (
          fetchReferenceFile(url, `${selection.productSlug}-${index + 1}.webp`)
        )));
        referenceFiles.forEach((file, index) => formData.append(`referenceImage${index + 1}`, file, file.name));
      } catch (error) {
        console.error('Ürün referans görselleri alınamadı:', error);
        showToast('Seçilen ürün referansları yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 7200);
        return;
      }
    } else {
      Object.entries(selection).forEach(([key, value]) => {
        if (key !== 'mode') formData.append(key, String(value));
      });
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    setRendering(true);
    resultSection.hidden = true;

    try {
      const response = await fetch('/api/render-ceramic', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(apiErrorMessage(response.status, payload)), { status: response.status, payload });
      if (!payload.imageBase64) throw new Error('API geçerli bir tasarım görseli döndürmedi.');
      configureResult(selection, payload.imageBase64, payload.mimeType || 'image/jpeg');
      showToast(selection.mode === 'product'
        ? 'Ürün yerleşimi hazır. Önce-sonra sürgüsüyle karşılaştırabilirsiniz.'
        : 'Tasarımınız hazır. Önce-sonra sürgüsüyle karşılaştırabilirsiniz.');
    } catch (error) {
      console.error('Yapay zekâ tasarım hatası:', error);
      const message = error.name === 'AbortError'
        ? 'Tasarım işlemi zaman aşımına uğradı. Aynı fotoğrafla yeniden deneyin.'
        : error.message || 'Tasarım oluşturulamadı. Lütfen tekrar deneyin.';
      showToast(message, 8200);
    } finally {
      window.clearTimeout(timeout);
      setRendering(false);
    }
  }

  function updateComparison(value) {
    const position = Math.max(0, Math.min(100, Number(value) || 50));
    afterWrap.style.clipPath = `inset(0 ${100 - position}% 0 0)`;
    compareDivider.style.left = `${position}%`;
  }

  compareRange.addEventListener('input', () => updateComparison(compareRange.value));
  renderButton.addEventListener('click', renderDesign);

  downloadResult.addEventListener('click', () => {
    if (!state.resultDataUrl) return;
    const link = document.createElement('a');
    link.href = state.resultDataUrl;
    link.download = `yanar-seramik-ai-tasarim-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  redesignButton.addEventListener('click', () => {
    resultSection.hidden = true;
    app.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Seçimlerinizi değiştirip yeniden tasarlayabilirsiniz.');
  });

  const params = new URLSearchParams(window.location.search);
  const requestedMode = params.get('mode');
  const requestedProduct = params.get('product');
  if (requestedMode === 'product') state.mode = 'product';
  if (requestedProduct && products[requestedProduct]) state.selectedProduct = requestedProduct;

  window.addEventListener('beforeunload', revokeSourceUrl);
  updateProductUI();
  updateSummary();
  updateRenderAvailability();
})();
