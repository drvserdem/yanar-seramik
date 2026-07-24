(() => {
  'use strict';

  const app = document.querySelector('#tileStudioApp');
  if (!app) return;

  const shell = document.querySelector('#cameraShell');
  const video = document.querySelector('#cameraVideo');
  const poster = document.querySelector('#studioPoster');
  const canvas = document.querySelector('#tileOverlay');
  const pointsWrap = document.querySelector('#surfaceGuide');
  const pointButtons = [...document.querySelectorAll('.surface-point')];
  const status = document.querySelector('#cameraStatus');
  const instruction = document.querySelector('#cameraInstruction');
  const toast = document.querySelector('#studioToast');
  const startButtons = [document.querySelector('#startCamera'), document.querySelector('#startCameraPrimary')].filter(Boolean);
  const switchCameraButton = document.querySelector('#switchCamera');
  const captureButton = document.querySelector('#captureDesign');
  const resetSurfaceButton = document.querySelector('#resetSurface');
  const offerButton = document.querySelector('#requestStudioOffer');
  const surfaceButtons = [...document.querySelectorAll('[data-surface]')];
  const materialButtons = [...document.querySelectorAll('.material-option[data-material]')];
  const customColorInput = document.querySelector('#customTileColor');
  const customColorOption = customColorInput?.closest('.custom-color');
  const tileSizeSelect = document.querySelector('#tileSize');
  const patternSelect = document.querySelector('#layoutPattern');
  const surfaceWidthInput = document.querySelector('#surfaceWidth');
  const surfaceHeightInput = document.querySelector('#surfaceHeight');
  const groutColorSelect = document.querySelector('#groutColor');
  const groutWidthInput = document.querySelector('#groutWidth');
  const opacityInput = document.querySelector('#tileOpacity');
  const opacityValue = document.querySelector('#tileOpacityValue');
  const designSummary = document.querySelector('#designSummary');
  const designDetail = document.querySelector('#designDetail');

  const materialNames = {
    calacatta: 'Calacatta',
    travertine: 'Traverten',
    sage: 'Adaçayı',
    ocean: 'Okyanus',
    graphite: 'Grafit',
    terracotta: 'Terakota',
    mustard: 'Hardal',
    custom: 'Özel Renk'
  };
  const materialIndexes = {
    calacatta: 0,
    travertine: 1,
    sage: 2,
    ocean: 3,
    graphite: 4,
    terracotta: 5,
    mustard: 6,
    custom: 7
  };
  const patternNames = {
    straight: 'Düz döşeme',
    staggered: 'Şaşırtmalı',
    vertical: 'Dikey döşeme',
    checker: 'Ton geçişli'
  };
  const groutNames = {
    '#f3f1e9': 'Kırık Beyaz',
    '#d0d0cc': 'Açık Gri',
    '#8b8b88': 'Orta Gri',
    '#363b3d': 'Antrasit',
    '#c5af91': 'Bej'
  };

  const state = {
    surface: 'wall',
    material: 'calacatta',
    baseColor: '#e9e7df',
    tileWidth: 60,
    tileHeight: 60,
    pattern: 'straight',
    surfaceWidth: 240,
    surfaceHeight: 240,
    groutColor: '#f3f1e9',
    groutWidth: 0.4,
    opacity: 0.82,
    facingMode: 'environment',
    cameraActive: false,
    stream: null,
    points: []
  };

  const presets = {
    wall: [
      { x: 0.18, y: 0.17 },
      { x: 0.82, y: 0.19 },
      { x: 0.80, y: 0.82 },
      { x: 0.20, y: 0.82 }
    ],
    floor: [
      { x: 0.18, y: 0.49 },
      { x: 0.82, y: 0.50 },
      { x: 0.96, y: 0.94 },
      { x: 0.04, y: 0.94 }
    ]
  };

  const inAppBrowser = /Instagram|FBAN|FBAV|Line\/|WhatsApp|TikTok|GSA\//i.test(navigator.userAgent || '');
  let toastTimer = 0;
  let animationFrame = 0;
  let activeDrag = null;

  function showToast(message, duration = 4400) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), duration);
  }

  function hexToRgb(hex) {
    const value = String(hex || '#ffffff').replace('#', '');
    const full = value.length === 3 ? value.split('').map((part) => part + part).join('') : value.padEnd(6, 'f');
    const number = Number.parseInt(full, 16);
    return [((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
  }

  function clonePreset(name) {
    return presets[name].map((point) => ({ ...point }));
  }

  function updatePointPositions() {
    pointButtons.forEach((button, index) => {
      const point = state.points[index];
      if (!point) return;
      button.style.left = `${point.x * 100}%`;
      button.style.top = `${point.y * 100}%`;
    });
  }

  function resetSurface() {
    state.points = clonePreset(state.surface);
    updatePointPositions();
    updateHomography();
    showToast(`${state.surface === 'wall' ? 'Duvar' : 'Zemin'} alanı başlangıç konumuna getirildi.`);
  }

  function setSurface(name) {
    state.surface = name === 'floor' ? 'floor' : 'wall';
    surfaceButtons.forEach((button) => button.classList.toggle('active', button.dataset.surface === state.surface));
    if (state.surface === 'floor') {
      state.surfaceWidth = 300;
      state.surfaceHeight = 240;
      surfaceWidthInput.value = '300';
      surfaceHeightInput.value = '240';
      instruction.textContent = 'Noktaları zeminin dört köşesine taşıyın; alt iki noktayı size yakın kenara yerleştirin.';
    } else {
      state.surfaceWidth = 240;
      state.surfaceHeight = 240;
      surfaceWidthInput.value = '240';
      surfaceHeightInput.value = '240';
      instruction.textContent = 'Dört noktayı kaplamak istediğiniz duvar yüzeyinin köşelerine taşıyın.';
    }
    resetSurface();
    updateSummary();
  }

  pointButtons.forEach((button, index) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      activeDrag = index;
      button.classList.add('dragging');
      button.setPointerCapture?.(event.pointerId);
    });
    button.addEventListener('pointermove', (event) => {
      if (activeDrag !== index) return;
      event.preventDefault();
      const rect = shell.getBoundingClientRect();
      const x = Math.min(0.99, Math.max(0.01, (event.clientX - rect.left) / rect.width));
      const y = Math.min(0.99, Math.max(0.01, (event.clientY - rect.top) / rect.height));
      state.points[index] = { x, y };
      updatePointPositions();
      updateHomography();
    });
    const endDrag = (event) => {
      if (activeDrag !== index) return;
      activeDrag = null;
      button.classList.remove('dragging');
      try { button.releasePointerCapture?.(event.pointerId); } catch (_) { /* no-op */ }
    };
    button.addEventListener('pointerup', endDrag);
    button.addEventListener('pointercancel', endDrag);
  });

  surfaceButtons.forEach((button) => button.addEventListener('click', () => setSurface(button.dataset.surface)));
  resetSurfaceButton?.addEventListener('click', resetSurface);

  // --- Canvas live tile renderer -----------------------------------------------
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) {
    showToast('Bu tarayıcı canlı kaplama görüntüsünü desteklemiyor. Safari veya Chrome ile tekrar deneyin.', 8000);
    return;
  }

  let drawQueued = false;

  function resizeCanvas() {
    const rect = shell.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
  }

  function scaledPoints() {
    return state.points.map((point) => ({ x: point.x * canvas.width, y: point.y * canvas.height }));
  }

  function quadPoint(points, u, v) {
    const topX = points[0].x + (points[1].x - points[0].x) * u;
    const topY = points[0].y + (points[1].y - points[0].y) * u;
    const bottomX = points[3].x + (points[2].x - points[3].x) * u;
    const bottomY = points[3].y + (points[2].y - points[3].y) * u;
    return {
      x: topX + (bottomX - topX) * v,
      y: topY + (bottomY - topY) * v
    };
  }

  function polygonPath(points) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) context.lineTo(points[index].x, points[index].y);
    context.closePath();
  }

  function varyColor(hex, amount) {
    const [r, g, b] = hexToRgb(hex).map((value) => value * 255);
    const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
    return `rgb(${clamp(r + amount)},${clamp(g + amount)},${clamp(b + amount)})`;
  }

  function seededVariation(row, column) {
    const value = Math.sin((row + 1) * 12.9898 + (column + 1) * 78.233) * 43758.5453;
    return (value - Math.floor(value)) - 0.5;
  }

  function tileFill(tilePoints, row, column) {
    const variation = seededVariation(row, column);
    const minX = Math.min(...tilePoints.map((point) => point.x));
    const maxX = Math.max(...tilePoints.map((point) => point.x));
    const minY = Math.min(...tilePoints.map((point) => point.y));
    const maxY = Math.max(...tilePoints.map((point) => point.y));
    const gradient = context.createLinearGradient(minX, minY, maxX, maxY);

    if (state.material === 'calacatta') {
      gradient.addColorStop(0, varyColor('#f0eee7', variation * 14));
      gradient.addColorStop(0.52, varyColor('#dfded8', variation * 10));
      gradient.addColorStop(1, varyColor('#f7f5ef', variation * 12));
    } else if (state.material === 'travertine') {
      gradient.addColorStop(0, varyColor('#d7c9ae', variation * 18));
      gradient.addColorStop(0.5, varyColor('#bca98c', variation * 12));
      gradient.addColorStop(1, varyColor('#e1d4bc', variation * 16));
    } else {
      gradient.addColorStop(0, varyColor(state.baseColor, variation * 24 + 10));
      gradient.addColorStop(0.55, varyColor(state.baseColor, variation * 18));
      gradient.addColorStop(1, varyColor(state.baseColor, variation * 22 - 11));
    }
    return gradient;
  }

  function drawMaterialDetail(tilePoints, row, column) {
    const minX = Math.min(...tilePoints.map((point) => point.x));
    const maxX = Math.max(...tilePoints.map((point) => point.x));
    const minY = Math.min(...tilePoints.map((point) => point.y));
    const maxY = Math.max(...tilePoints.map((point) => point.y));
    const width = maxX - minX;
    const height = maxY - minY;
    if (width < 8 || height < 8) return;

    context.save();
    polygonPath(tilePoints);
    context.clip();

    if (state.material === 'calacatta') {
      context.globalAlpha = 0.20;
      context.strokeStyle = '#687178';
      context.lineWidth = Math.max(0.8, Math.min(width, height) * 0.035);
      context.beginPath();
      const seed = seededVariation(row, column);
      context.moveTo(minX - width * 0.1, minY + height * (0.28 + seed * 0.25));
      context.bezierCurveTo(minX + width * 0.25, minY + height * (0.02 + seed * 0.15), minX + width * 0.62, minY + height * (0.84 - seed * 0.2), maxX + width * 0.1, minY + height * (0.48 + seed * 0.22));
      context.stroke();
    } else if (state.material === 'travertine') {
      context.globalAlpha = 0.15;
      context.strokeStyle = '#796d59';
      context.lineWidth = Math.max(0.7, height * 0.025);
      for (let line = 1; line < 4; line += 1) {
        const y = minY + (height * line) / 4;
        context.beginPath();
        context.moveTo(minX, y);
        context.lineTo(maxX, y + seededVariation(row + line, column) * height * 0.08);
        context.stroke();
      }
    }

    const gloss = context.createLinearGradient(minX, minY, maxX, maxY);
    gloss.addColorStop(0, 'rgba(255,255,255,.20)');
    gloss.addColorStop(0.35, 'rgba(255,255,255,.02)');
    gloss.addColorStop(0.75, 'rgba(255,255,255,.10)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    context.globalAlpha = 0.65;
    context.fillStyle = gloss;
    context.fillRect(minX, minY, width, height);
    context.restore();
  }

  function drawTiles() {
    drawQueued = false;
    resizeCanvas();
    context.clearRect(0, 0, canvas.width, canvas.height);
    const quad = scaledPoints();
    if (quad.length !== 4) return;

    context.save();
    context.globalAlpha = state.opacity;
    context.lineJoin = 'round';
    polygonPath(quad);
    context.clip();
    context.fillStyle = state.groutColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    let tileWidth = state.tileWidth;
    let tileHeight = state.tileHeight;
    if (state.pattern === 'vertical') [tileWidth, tileHeight] = [tileHeight, tileWidth];

    const rawColumns = Math.max(1, Math.ceil(state.surfaceWidth / tileWidth));
    const rawRows = Math.max(1, Math.ceil(state.surfaceHeight / tileHeight));
    const columns = Math.min(rawColumns, 90);
    const rows = Math.min(rawRows, 90);
    const uStep = 1 / columns;
    const vStep = 1 / rows;
    const groutU = Math.min(uStep * 0.42, state.groutWidth / state.surfaceWidth);
    const groutV = Math.min(vStep * 0.42, state.groutWidth / state.surfaceHeight);

    for (let row = 0; row < rows; row += 1) {
      const offset = state.pattern === 'staggered' && row % 2 ? -0.5 : 0;
      for (let column = -1; column <= columns; column += 1) {
        let u0 = (column + offset) * uStep;
        let u1 = u0 + uStep;
        const v0 = row * vStep;
        const v1 = v0 + vStep;
        if (u1 <= 0 || u0 >= 1 || v1 <= 0 || v0 >= 1) continue;
        u0 = Math.max(0, u0);
        u1 = Math.min(1, u1);

        const insetU = Math.min((u1 - u0) * 0.32, groutU * 0.5);
        const insetV = Math.min((v1 - v0) * 0.32, groutV * 0.5);
        const a = quadPoint(quad, u0 + insetU, v0 + insetV);
        const b = quadPoint(quad, u1 - insetU, v0 + insetV);
        const c = quadPoint(quad, u1 - insetU, v1 - insetV);
        const d = quadPoint(quad, u0 + insetU, v1 - insetV);
        const tilePoints = [a, b, c, d];

        context.fillStyle = tileFill(tilePoints, row, column);
        polygonPath(tilePoints);
        context.fill();

        if (state.pattern === 'checker' && (row + column) % 2 === 0) {
          context.fillStyle = 'rgba(0,0,0,.08)';
          polygonPath(tilePoints);
          context.fill();
        }
        drawMaterialDetail(tilePoints, row, column);
      }
    }
    context.restore();
  }

  function scheduleDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(drawTiles);
  }

  function updateHomography() {
    scheduleDraw();
  }

  function updateMaterial(material, color) {
    state.material = material;
    state.baseColor = color;
    materialButtons.forEach((button) => button.classList.toggle('active', button.dataset.material === material));
    customColorOption?.classList.toggle('active', material === 'custom');
    updateSummary();
    scheduleDraw();
  }

  materialButtons.forEach((button) => {
    button.addEventListener('click', () => updateMaterial(button.dataset.material, button.dataset.color));
  });

  customColorInput?.addEventListener('input', () => {
    const color = customColorInput.value;
    const swatch = customColorOption?.querySelector('i');
    if (swatch) swatch.style.background = color;
    updateMaterial('custom', color);
  });

  tileSizeSelect?.addEventListener('change', () => {
    const [width, height] = tileSizeSelect.value.split(',').map(Number);
    state.tileWidth = width;
    state.tileHeight = height;
    updateSummary();
    scheduleDraw();
  });
  patternSelect?.addEventListener('change', () => { state.pattern = patternSelect.value; updateSummary(); scheduleDraw(); });
  surfaceWidthInput?.addEventListener('input', () => { state.surfaceWidth = Math.max(50, Number(surfaceWidthInput.value) || 240); updateSummary(); scheduleDraw(); });
  surfaceHeightInput?.addEventListener('input', () => { state.surfaceHeight = Math.max(50, Number(surfaceHeightInput.value) || 240); updateSummary(); scheduleDraw(); });
  groutColorSelect?.addEventListener('change', () => { state.groutColor = groutColorSelect.value; updateSummary(); scheduleDraw(); });
  groutWidthInput?.addEventListener('input', () => { state.groutWidth = Math.max(0.1, Number(groutWidthInput.value) || 0.4); updateSummary(); scheduleDraw(); });
  opacityInput?.addEventListener('input', () => {
    state.opacity = Number(opacityInput.value) / 100;
    opacityValue.value = `${opacityInput.value}%`;
    scheduleDraw();
  });

  function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
  }

  function updateSummary() {
    const size = `${formatNumber(state.tileWidth)} × ${formatNumber(state.tileHeight)} cm`;
    designSummary.textContent = `${materialNames[state.material]} · ${size} · ${patternNames[state.pattern]}`;
    designDetail.textContent = `${state.surface === 'wall' ? 'Duvar' : 'Zemin'} · ${formatNumber(state.surfaceWidth)} × ${formatNumber(state.surfaceHeight)} cm · ${groutNames[state.groutColor] || 'Özel'} derz`;
  }

  // --- Camera -------------------------------------------------------------------
  async function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }
    video.srcObject = null;
    state.cameraActive = false;
    shell.classList.remove('camera-active');
    status.innerHTML = '<i></i> DEMO GÖRÜNÜMÜ';
    switchCameraButton.disabled = true;
    captureButton.disabled = true;
    startButtons.forEach((button) => {
      button.disabled = false;
      button.innerHTML = '<svg><use href="#i-camera"></use></svg> Kamerayı Aç';
    });
  }

  function cameraErrorMessage(error) {
    switch (error?.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Kamera izni verilmedi. Safari adres çubuğundaki sayfa ayarlarından Kamera → İzin Ver seçeneğini açın.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'Bu cihazda kullanılabilir kamera bulunamadı.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Kamera başka bir uygulama tarafından kullanılıyor olabilir. Diğer kamera uygulamalarını kapatıp tekrar deneyin.';
      case 'OverconstrainedError':
        return 'İstenen kamera modu bu cihazda bulunamadı. Farklı kamerayla tekrar deneniyor.';
      default:
        return 'Kamera başlatılamadı. Sayfayı Safari veya Chrome ile HTTPS üzerinden açıp tekrar deneyin.';
    }
  }

  async function startCamera() {
    if (!window.isSecureContext && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      showToast('Kamera yalnızca güvenli HTTPS bağlantısında çalışır.', 7000);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Bu tarayıcı canlı kamera erişimini desteklemiyor. Safari veya Chrome ile açın.', 7000);
      return;
    }
    if (inAppBrowser) {
      showToast('Instagram veya WhatsApp içi tarayıcı kamerayı kısıtlayabilir. Sorun yaşarsanız menüden “Safari’de Aç” seçeneğini kullanın.', 7500);
    }

    try {
      await stopCamera();
      startButtons.forEach((button) => { button.disabled = true; button.textContent = 'Kamera hazırlanıyor…'; });
      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: state.facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 60 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      state.stream = stream;
      video.srcObject = stream;
      await video.play();
      state.cameraActive = true;
      shell.classList.add('camera-active');
      status.innerHTML = '<i></i> CANLI KAMERA';
      instruction.textContent = state.surface === 'wall'
        ? 'Dört noktayı kaplamak istediğiniz duvar yüzeyinin köşelerine taşıyın.'
        : 'Noktaları zeminin dört köşesine taşıyın; alt iki noktayı size yakın kenara yerleştirin.';
      switchCameraButton.disabled = false;
      captureButton.disabled = false;
      startButtons.forEach((button) => {
        button.disabled = false;
        button.innerHTML = '<svg><use href="#i-refresh"></use></svg> Kamerayı Yeniden Başlat';
      });
      showToast('Kamera açıldı. Şimdi dört köşe noktasını yüzeyin sınırlarına yerleştirin.');
    } catch (error) {
      console.error('Kamera hatası:', error);
      showToast(cameraErrorMessage(error), 8000);
      startButtons.forEach((button) => {
        button.disabled = false;
        button.innerHTML = '<svg><use href="#i-camera"></use></svg> Kamerayı Aç';
      });
    }
  }

  startButtons.forEach((button) => button.addEventListener('click', startCamera));
  switchCameraButton?.addEventListener('click', async () => {
    state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment';
    await startCamera();
  });

  function drawCover(context, source, width, height) {
    const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
    const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
    if (!sourceWidth || !sourceHeight) return;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;
    context.drawImage(source, x, y, drawWidth, drawHeight);
  }

  async function createSnapshotBlob() {
    const rect = shell.getBoundingClientRect();
    const width = Math.min(1600, Math.max(720, Math.round(rect.width * 1.65)));
    const height = Math.round(width * (rect.height / rect.width));
    const output = document.createElement('canvas');
    output.width = width;
    output.height = height;
    const context = output.getContext('2d');
    context.fillStyle = '#10272d';
    context.fillRect(0, 0, width, height);
    drawCover(context, state.cameraActive ? video : poster, width, height);
    context.drawImage(canvas, 0, 0, width, height);

    const gradient = context.createLinearGradient(0, height * 0.68, 0, height);
    gradient.addColorStop(0, 'rgba(6,22,27,0)');
    gradient.addColorStop(1, 'rgba(6,22,27,.82)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.font = `700 ${Math.round(width * 0.025)}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    context.fillText('YANAR SERAMİK · CANLI STÜDYO', Math.round(width * 0.04), Math.round(height * 0.91));
    context.font = `500 ${Math.round(width * 0.016)}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    context.fillStyle = 'rgba(255,255,255,.78)';
    context.fillText(designSummary.textContent, Math.round(width * 0.04), Math.round(height * 0.95));

    return new Promise((resolve, reject) => output.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Görsel oluşturulamadı')), 'image/png', 0.95));
  }

  async function saveSnapshot() {
    try {
      const blob = await createSnapshotBlob();
      const file = new File([blob], `yanar-seramik-onizleme-${Date.now()}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Yanar Seramik Canlı Önizleme', text: designSummary.textContent, files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1200);
        showToast('Görünüm cihazınıza kaydedildi.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error);
        showToast('Görünüm kaydedilemedi. Tekrar deneyin.');
      }
    }
  }

  captureButton?.addEventListener('click', saveSnapshot);

  function offerText() {
    return [
      'Merhaba Yanar Seramik, Canlı Seramik Stüdyosu üzerinden bir tasarım oluşturdum.',
      '',
      `Yüzey: ${state.surface === 'wall' ? 'Duvar' : 'Zemin'}`,
      `Koleksiyon / Renk: ${materialNames[state.material]}`,
      `Seramik Ebatı: ${formatNumber(state.tileWidth)} × ${formatNumber(state.tileHeight)} cm`,
      `Döşeme: ${patternNames[state.pattern]}`,
      `Derz: ${groutNames[state.groutColor] || 'Özel'} / ${formatNumber(state.groutWidth)} cm`,
      `Yaklaşık Yüzey: ${formatNumber(state.surfaceWidth)} × ${formatNumber(state.surfaceHeight)} cm`,
      '',
      'Bu görünüm için keşif ve fiyat bilgisi almak istiyorum.'
    ].join('\n');
  }

  offerButton?.addEventListener('click', async () => {
    const text = offerText();
    try {
      if (state.cameraActive) {
        const blob = await createSnapshotBlob();
        const file = new File([blob], `yanar-seramik-tasarim-${Date.now()}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: 'Yanar Seramik Tasarım Talebi', text, files: [file] });
          return;
        }
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.warn('Paylaşım görseli hazırlanamadı:', error);
    }
    const url = `https://wa.me/905415807369?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    updatePointPositions();
  }, { passive: true });
  window.addEventListener('pagehide', stopCamera);

  // Initial state
  state.points = clonePreset('wall');
  updatePointPositions();
  updateSummary();
  resizeCanvas();
  scheduleDraw();
})();
