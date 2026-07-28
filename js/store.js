const { STORE_PRODUCTS, PRODUCT_CATEGORIES, getProduct } = window.YANAR_STORE;
const { readQuoteCart, addToQuoteCart, removeFromQuoteCart, updateQuoteQuantity, clearQuoteCart } = window.YANAR_CART;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const grid = $('#storeProductGrid');
const filters = $('#storeFilters');
const searchInput = $('#storeSearch');
const countLabel = $('#storeProductCount');
const arModal = $('#storeArModal');
const arViewer = $('#storeArViewer');
const arTitle = $('#storeArTitle');
const arSpecs = $('#storeArSpecs');
const arAiLink = $('#storeArAiLink');
const arDetailLink = $('#storeArDetailLink');
const arVariantWrap = $('#storeArVariants');
const arScale = $('#storeArScale');
const cartDrawer = $('#quoteDrawer');
const cartList = $('#quoteDrawerList');
const cartCountNodes = $$('[data-quote-count]');
const cartWhatsApp = $('#quoteWhatsApp');
const toast = $('#storeToast');
const guideRoom = $('#guideRoom');
const guideGoal = $('#guideGoal');
const guideResult = $('#guideResult');
const guideButton = $('#guideRecommend');
const menuToggle = $('.menu-toggle');
const mainNav = $('#mainNav');

let activeCategory = 'all';
let activeArProduct = STORE_PRODUCTS[0];
let activeArVariant = null;
let toastTimer = 0;

function formatPrice(value) {
  return `${new Intl.NumberFormat('tr-TR').format(Number(value) || 0)} TL`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function renderFilters() {
  filters.innerHTML = PRODUCT_CATEGORIES.map((category) => `
    <button type="button" class="${category.id === activeCategory ? 'active' : ''}" data-filter="${category.id}">${category.label}</button>
  `).join('');
}

function filteredProducts() {
  const query = String(searchInput.value || '').trim().toLocaleLowerCase('tr-TR');
  return STORE_PRODUCTS.filter((product) => {
    const categoryMatch = activeCategory === 'all' || product.category === activeCategory;
    const haystack = [product.name, product.categoryLabel, product.description, ...(product.keywords || [])].join(' ').toLocaleLowerCase('tr-TR');
    return categoryMatch && (!query || haystack.includes(query));
  });
}

function productCard(product) {
  const variantDots = product.variants.length
    ? `<div class="store-color-dots" aria-label="Renk seçenekleri">${product.variants.map((variant) => `<i style="--swatch:${variant.swatch}" title="${variant.label}"></i>`).join('')}</div>`
    : '';
  return `
    <article class="store-product-card" data-product-card="${product.id}">
      <a class="store-product-image" href="urun.html?product=${encodeURIComponent(product.id)}" aria-label="${product.name} detaylarını aç">
        <img src="${product.hero}" alt="${product.name}" loading="lazy">
        <span>${product.badge}</span>
        <b>AR HAZIR</b>
      </a>
      <div class="store-product-content">
        <div class="store-product-heading">
          <div><small>${product.categoryLabel}</small><h3>${product.name}</h3></div>${variantDots}
        </div>
        <p>${product.tagline}</p>
        <div class="store-product-price"><small>Başlangıç fiyatı</small><strong>${formatPrice(product.price)}</strong><span>Kişiselleştirme ve teslimat ayrıca hesaplanır.</span></div>
        <div class="store-product-specs"><span>${product.dimensions}</span><span>${product.coating}</span><span>${product.weight}</span></div>
        <div class="store-card-path"><span>1 · Ölçüyü kontrol et</span><i></i><span>2 · Mekânında gör</span><i></i><span>3 · Teklif iste</span></div>
        <div class="store-card-actions">
          <button type="button" class="store-action-primary" data-open-ar="${product.id}">1 · AR’da Gör</button>
          <a href="canli-seramik.html?mode=product&amp;product=${encodeURIComponent(product.aiProduct)}">2 · Mekânımda Dene</a>
          <a href="urun.html?product=${encodeURIComponent(product.id)}">Detayları İncele</a>
        </div>
        <button type="button" class="store-quote-add" data-add-quote="${product.id}">3 · Teklif Listeme Ekle</button>
      </div>
    </article>`;
}

function renderProducts() {
  const products = filteredProducts();
  grid.innerHTML = products.map(productCard).join('') || '<div class="store-empty">Aramanıza uygun ürün bulunamadı.</div>';
  countLabel.textContent = `${products.length} ürün`;
}

function currentVariant(product, variantId = '') {
  return product.variants.find((variant) => variant.id === variantId) || product.variants[0] || null;
}

function applyArProduct(product, variantId = '') {
  activeArProduct = product;
  activeArVariant = currentVariant(product, variantId);
  const source = activeArVariant || product;
  const scale = Number(product.modelScale || 0.82);

  arViewer.pause?.();
  arViewer.setAttribute('src', source.model || product.model);
  arViewer.setAttribute('poster', source.poster || product.poster);
  arViewer.setAttribute('camera-orbit', product.cameraOrbit);
  arViewer.setAttribute('camera-target', product.cameraTarget);
  arViewer.setAttribute('field-of-view', product.fieldOfView);
  arViewer.setAttribute('scale', `${scale} ${scale} ${scale}`);
  arViewer.setAttribute('ar-scale', 'auto');
  arViewer.removeAttribute('ios-src');
  arViewer.alt = `${product.name} üç boyutlu AR modeli`;
  arScale.value = String(Math.round(scale * 100));

  arTitle.textContent = activeArVariant ? `${product.name} · ${activeArVariant.label}` : product.name;
  arSpecs.textContent = `${formatPrice(product.price)} · ${product.dimensions} · ${product.coating} · ${product.weight}`;
  arAiLink.href = `canli-seramik.html?mode=product&product=${encodeURIComponent(activeArVariant?.aiProduct || product.aiProduct)}`;
  arDetailLink.href = `urun.html?product=${encodeURIComponent(product.id)}${activeArVariant ? `&variant=${encodeURIComponent(activeArVariant.id)}` : ''}`;

  arVariantWrap.innerHTML = product.variants.length ? product.variants.map((variant) => `
    <button type="button" class="${activeArVariant?.id === variant.id ? 'active' : ''}" data-ar-variant="${variant.id}"><i style="--swatch:${variant.swatch}"></i>${variant.label}</button>
  `).join('') : '';
  arVariantWrap.hidden = !product.variants.length;
}

function openAr(productId, variantId = '') {
  const product = getProduct(productId);
  applyArProduct(product, variantId);
  arModal.hidden = false;
  document.body.classList.add('store-modal-open');
  requestAnimationFrame(() => arModal.classList.add('open'));
}

function closeAr() {
  arModal.classList.remove('open');
  document.body.classList.remove('store-modal-open');
  setTimeout(() => { arModal.hidden = true; }, 260);
}

function cartEntry(item) {
  const product = getProduct(item.id);
  const variant = currentVariant(product, item.variantId);
  const source = variant || product;
  return `
    <article class="quote-item">
      <img src="${source.poster || product.poster}" alt="${product.name}">
      <div><strong>${product.name}${variant ? ` · ${variant.label}` : ''}</strong><small>${product.dimensions} · ${formatPrice(product.price)}</small>
        <div class="quote-quantity"><button data-qty-minus="${item.key}" type="button">−</button><span>${item.quantity}</span><button data-qty-plus="${item.key}" type="button">+</button></div>
      </div>
      <button class="quote-remove" data-remove-quote="${item.key}" type="button" aria-label="Ürünü listeden kaldır">×</button>
    </article>`;
}

function renderCart() {
  const items = readQuoteCart();
  const total = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  cartCountNodes.forEach((node) => { node.textContent = String(total); });
  cartList.innerHTML = items.length ? items.map(cartEntry).join('') : '<p class="quote-empty">Teklif listeniz boş. Beğendiğiniz ürünleri ekleyerek tek mesajda fiyat isteyebilirsiniz.</p>';

  const lines = items.map((item) => {
    const product = getProduct(item.id);
    const variant = currentVariant(product, item.variantId);
    return `• ${product.name}${variant ? ` (${variant.label})` : ''} — ${product.dimensions} — ${formatPrice(product.price)} — Adet: ${item.quantity || 1}`;
  });
  const estimatedTotal = items.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (Number(product.price) || 0) * (item.quantity || 1);
  }, 0);
  const message = ['Merhaba Yanar Seramik, aşağıdaki ürünler için teklif almak istiyorum:', '', ...lines, '', `Ürün başlangıç fiyatları toplamı: ${formatPrice(estimatedTotal)}`, 'Nihai fiyatın renk, kişiselleştirme ve teslimat bilgileriyle netleştirileceğini biliyorum.', '', 'AR ve yapay zekâ denememi tamamladım. Varsa önce-sonra görsellerimi bu görüşmeye ekleyeceğim.'].join('\n');
  cartWhatsApp.href = items.length ? `https://wa.me/905438964440?text=${encodeURIComponent(message)}` : '#';
  cartWhatsApp.classList.toggle('disabled', !items.length);
}

function openCart() {
  renderCart();
  cartDrawer.hidden = false;
  requestAnimationFrame(() => cartDrawer.classList.add('open'));
  document.body.classList.add('store-modal-open');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  document.body.classList.remove('store-modal-open');
  setTimeout(() => { cartDrawer.hidden = true; }, 260);
}

function recommendProduct() {
  const room = guideRoom.value;
  const goal = guideGoal.value;
  let id = 'mosaic-coffee-table';
  if (room === 'bedroom') id = 'nightstand-green';
  else if (room === 'entry') id = 'console';
  else if (goal === 'tv') id = 'tv-unit';
  else if (goal === 'dining') id = 'table-blue';
  else if (goal === 'storage') id = room === 'living' ? 'tv-unit' : 'nightstand-green';
  else if (goal === 'accent') id = room === 'entry' ? 'console' : 'mosaic-coffee-table';

  const product = getProduct(id);
  guideResult.innerHTML = `
    <img src="${product.hero}" alt="${product.name}">
    <div><span>YAPAY ZEKÂ REHBERİ ÖNERİSİ</span><h3>${product.name}</h3><p>${product.tagline}</p><strong class="guide-result-price">${formatPrice(product.price)}</strong>
      <div class="guide-result-actions"><button type="button" data-open-ar="${product.id}">1 · AR’da Gör</button><a href="canli-seramik.html?mode=product&amp;product=${encodeURIComponent(product.aiProduct)}">2 · Mekânımda Dene</a><a href="urun.html?product=${product.id}">Detayları İncele</a></div>
    </div>`;
  guideResult.hidden = false;
  guideResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

filters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeCategory = button.dataset.filter;
  renderFilters();
  renderProducts();
});
searchInput.addEventListener('input', renderProducts);

document.addEventListener('click', (event) => {
  const arButton = event.target.closest('[data-open-ar]');
  if (arButton) openAr(arButton.dataset.openAr);

  const addButton = event.target.closest('[data-add-quote]');
  if (addButton) {
    const product = getProduct(addButton.dataset.addQuote);
    const variant = currentVariant(product);
    addToQuoteCart(product.id, variant?.id || '');
    showToast(`${product.name} teklif listenize eklendi.`);
    renderCart();
  }

  const removeButton = event.target.closest('[data-remove-quote]');
  if (removeButton) { removeFromQuoteCart(removeButton.dataset.removeQuote); renderCart(); }
  const minus = event.target.closest('[data-qty-minus]');
  if (minus) {
    const item = readQuoteCart().find((entry) => entry.key === minus.dataset.qtyMinus);
    if (item) updateQuoteQuantity(item.key, Math.max(1, item.quantity - 1));
    renderCart();
  }
  const plus = event.target.closest('[data-qty-plus]');
  if (plus) {
    const item = readQuoteCart().find((entry) => entry.key === plus.dataset.qtyPlus);
    if (item) updateQuoteQuantity(item.key, item.quantity + 1);
    renderCart();
  }

  const variantButton = event.target.closest('[data-ar-variant]');
  if (variantButton) applyArProduct(activeArProduct, variantButton.dataset.arVariant);

  if (event.target.closest('[data-open-quote]')) openCart();
  if (event.target.closest('[data-close-quote]')) closeCart();
  if (event.target.closest('[data-close-ar]')) closeAr();
  if (event.target.closest('[data-clear-quote]')) { clearQuoteCart(); renderCart(); }
});

arScale.addEventListener('input', () => {
  const value = Math.max(60, Math.min(110, Number(arScale.value) || 82)) / 100;
  arViewer.setAttribute('scale', `${value} ${value} ${value}`);
  $('#storeArScaleValue').textContent = `%${Math.round(value * 100)}`;
});

guideButton.addEventListener('click', recommendProduct);
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  mainNav.classList.toggle('open', !open);
});

window.addEventListener('yanar:quote-cart-updated', renderCart);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { if (!arModal.hidden) closeAr(); if (!cartDrawer.hidden) closeCart(); }
});

renderFilters();
renderProducts();
renderCart();
applyArProduct(STORE_PRODUCTS[0]);
