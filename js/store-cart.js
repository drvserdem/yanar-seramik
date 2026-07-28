(() => {
'use strict';

const STORAGE_KEY = 'yanar_quote_cart_v1';

function readQuoteCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id) : [];
  } catch (_) {
    return [];
  }
}

function writeQuoteCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('yanar:quote-cart-updated', { detail: items }));
}

function addToQuoteCart(productId, variantId = '') {
  const items = readQuoteCart();
  const key = `${productId}:${variantId}`;
  const existing = items.find((item) => item.key === key);
  if (existing) existing.quantity = Math.min(20, (existing.quantity || 1) + 1);
  else items.push({ key, id: productId, variantId, quantity: 1 });
  writeQuoteCart(items);
  return items;
}

function removeFromQuoteCart(key) {
  const items = readQuoteCart().filter((item) => item.key !== key);
  writeQuoteCart(items);
  return items;
}

function updateQuoteQuantity(key, quantity) {
  const safe = Math.max(1, Math.min(20, Number(quantity) || 1));
  const items = readQuoteCart();
  const item = items.find((entry) => entry.key === key);
  if (item) item.quantity = safe;
  writeQuoteCart(items);
  return items;
}

function clearQuoteCart() {
  writeQuoteCart([]);
}

window.YANAR_CART = {
  readQuoteCart,
  writeQuoteCart,
  addToQuoteCart,
  removeFromQuoteCart,
  updateQuoteQuantity,
  clearQuoteCart
};
})();
