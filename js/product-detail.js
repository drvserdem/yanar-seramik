import { STORE_PRODUCTS, getProduct } from './store-data.js';
import { addToQuoteCart, readQuoteCart } from './store-cart.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const params = new URLSearchParams(location.search);
const product = getProduct(params.get('product'));
let activeVariant = product.variants.find((variant) => variant.id === params.get('variant')) || product.variants[0] || null;

const title = $('#productDetailTitle');
const category = $('#productDetailCategory');
const breadcrumbCategory = $('#productDetailBreadcrumbCategory');
const tagline = $('#productDetailTagline');
const description = $('#productDetailDescription');
const specs = $('#productDetailSpecs');
const viewer = $('#productDetailViewer');
const gallery = $('#productDetailGallery');
const variants = $('#productDetailVariants');
const aiLink = $('#productDetailAi');
const aiLinkSecondary = $('#productDetailAiSecondary');
const whatsapp = $('#productDetailWhatsApp');
const addQuote = $('#productDetailAddQuote');
const scale = $('#productDetailScale');
const scaleValue = $('#productDetailScaleValue');
const related = $('#relatedProducts');
const heroImage = $('#productDetailHeroImage');
const cartCount = $('[data-quote-count]');
const toast = $('#productDetailToast');
const menuToggle = $('.menu-toggle');
const mainNav = $('#mainNav');
let toastTimer = 0;

function sourceData() { return activeVariant || product; }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200); }
function updateCartCount() { cartCount.textContent = String(readQuoteCart().reduce((sum, item) => sum + (item.quantity || 1), 0)); }

function renderSpecs() {
  specs.innerHTML = [
    ['Ölçü', product.dimensions], ['Ağırlık', product.weight], ['Kaplama', product.coating], ['İç İskelet', product.frame], ['Kullanım', product.use], ['Bakım', product.care]
  ].map(([label, value]) => `<div><small>${label}</small><strong>${value}</strong></div>`).join('');
}

function applyVariant(variantId = '') {
  activeVariant = product.variants.find((variant) => variant.id === variantId) || product.variants[0] || null;
  const source = sourceData();
  const productScale = Number(product.modelScale || .82);
  viewer.pause?.();
  viewer.setAttribute('src', source.model || product.model);
  viewer.setAttribute('poster', source.poster || product.poster);
  viewer.setAttribute('camera-orbit', product.cameraOrbit);
  viewer.setAttribute('camera-target', product.cameraTarget);
  viewer.setAttribute('field-of-view', product.fieldOfView);
  viewer.setAttribute('scale', `${productScale} ${productScale} ${productScale}`);
  viewer.setAttribute('ar-scale', 'auto');
  viewer.removeAttribute('ios-src');
  viewer.alt = `${product.name}${activeVariant ? ` ${activeVariant.label}` : ''} 3D modeli`;
  scale.value = String(Math.round(productScale * 100));
  scaleValue.textContent = `%${Math.round(productScale * 100)}`;
  heroImage.src = source.hero || product.hero;
  aiLink.href = `canli-seramik.html?mode=product&product=${encodeURIComponent(source.aiProduct || product.aiProduct)}`;
  if (aiLinkSecondary) aiLinkSecondary.href = aiLink.href;
  whatsapp.href = `https://wa.me/905438964440?text=${encodeURIComponent(`Merhaba Yanar Seramik, ${product.name}${activeVariant ? ` (${activeVariant.label})` : ''} hakkında fiyat, üretim ve teslimat bilgisi almak istiyorum. Ölçü: ${product.dimensions}.`)}`;
  variants.innerHTML = product.variants.length ? product.variants.map((variant) => `<button type="button" class="${activeVariant?.id === variant.id ? 'active' : ''}" data-product-variant="${variant.id}"><i style="--swatch:${variant.swatch}"></i>${variant.label}</button>`).join('') : '';
  variants.hidden = !product.variants.length;
}

function renderGallery() {
  gallery.innerHTML = product.gallery.map((image, index) => `<button type="button" class="${index === 0 ? 'active' : ''}" data-gallery-image="${image}"><img src="${image}" alt="${product.name} görsel ${index + 1}" loading="lazy"></button>`).join('');
}

function renderRelated() {
  related.innerHTML = STORE_PRODUCTS.filter((item) => item.id !== product.id).slice(0, 3).map((item) => `<article><a href="urun.html?product=${item.id}"><img src="${item.hero}" alt="${item.name}" loading="lazy"><span>${item.categoryLabel}</span><h3>${item.name}</h3><p>${item.dimensions}</p></a></article>`).join('');
}

function init() {
  document.title = `${product.name} | Yanar Seramik Mağaza`;
  category.textContent = product.categoryLabel;
  if (breadcrumbCategory) breadcrumbCategory.textContent = product.categoryLabel;
  title.textContent = product.name;
  tagline.textContent = product.tagline;
  description.textContent = product.description;
  renderSpecs(); renderGallery(); renderRelated(); applyVariant(activeVariant?.id || ''); updateCartCount();
}

variants.addEventListener('click', (event) => { const button = event.target.closest('[data-product-variant]'); if (button) applyVariant(button.dataset.productVariant); });
gallery.addEventListener('click', (event) => {
  const button = event.target.closest('[data-gallery-image]'); if (!button) return;
  $$('.product-detail-gallery button').forEach((item) => item.classList.toggle('active', item === button));
  heroImage.src = button.dataset.galleryImage;
});
scale.addEventListener('input', () => { const value = Math.max(60, Math.min(110, Number(scale.value) || 82)) / 100; viewer.setAttribute('scale', `${value} ${value} ${value}`); scaleValue.textContent = `%${Math.round(value * 100)}`; });
addQuote.addEventListener('click', () => { addToQuoteCart(product.id, activeVariant?.id || ''); updateCartCount(); showToast(`${product.name} teklif listenize eklendi.`); });
$('#productDetailOpenAr').addEventListener('click', async () => { try { await viewer.activateAR(); } catch (_) { showToast('AR başlatılamadı. Safari veya Chrome ile tekrar deneyin.'); } });
menuToggle?.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') === 'true'; menuToggle.setAttribute('aria-expanded', String(!open)); mainNav.classList.toggle('open', !open); });
window.addEventListener('yanar:quote-cart-updated', updateCartCount);
init();
