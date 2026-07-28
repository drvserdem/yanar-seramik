(() => {
'use strict';

const STORE_PRODUCTS = [
  {
    id: 'tv-unit',
    name: 'Seramik TV Ünitesi',
    shortName: 'TV Ünitesi',
    category: 'tv-unit',
    categoryLabel: 'TV Ünitesi',
    badge: 'Yeni Ürün',
    price: 58500,
    tagline: 'Salonun merkezine el işçiliği karakteri.',
    description: 'Ahşap iç iskelet üzerine tek tek uygulanan parlak seramik yüzey, alçak ve uzun formu modern yaşam alanları için güçlü bir odak noktasına dönüştürür.',
    dimensions: '142 × 42 × 47h cm',
    weight: '90 kg',
    coating: 'Seramik',
    frame: 'Ahşap',
    use: 'Sadece iç mekân',
    care: 'Nemli bezle silinebilir',
    model: 'models/store-tv-unit.glb?v=20260725-store1',
    poster: 'images/products/tv-unit-standalone.webp',
    hero: 'images/products/tv-unit-lifestyle.webp',
    gallery: [
      'images/products/tv-unit-lifestyle.webp',
      'images/products/tv-unit-standalone.webp',
      'images/products/tv-unit-detail.webp',
      'images/products/tv-unit-close.webp'
    ],
    aiProduct: 'tv-unit',
    modelScale: 0.82,
    cameraOrbit: '28deg 70deg 2.15m',
    cameraTarget: '0m 0.24m 0m',
    fieldOfView: '27deg',
    keywords: ['salon', 'tv', 'depolama', 'konsol'],
    variants: []
  },
  {
    id: 'console',
    name: 'Seramik Dresuar',
    shortName: 'Dresuar',
    category: 'console',
    categoryLabel: 'Dresuar',
    badge: 'Renk Seçenekli',
    price: 42500,
    tagline: 'Dar alanda güçlü, mimari bir imza.',
    description: 'İki raflı açık form, seramik veya cam mozaik kaplamanın el işçiliği karakteriyle birleşir. Giriş, koridor ve salonlarda dekoratif kullanım için tasarlanmıştır.',
    dimensions: '81 × 28 × 91h cm',
    weight: '40–45 kg',
    coating: 'Seramik / Cam Mozaik',
    frame: 'Ahşap',
    use: 'Sadece iç mekân',
    care: 'Nemli bezle silinebilir',
    model: 'models/store-console-green.glb?v=20260725-store1',
    poster: 'images/products/console-green-standalone.webp',
    hero: 'images/products/console-green-lifestyle.webp',
    gallery: [
      'images/products/console-green-lifestyle.webp',
      'images/products/console-green-standalone.webp',
      'images/products/console-green-detail.webp',
      'images/products/console-cream-lifestyle.webp',
      'images/products/console-cream-detail.webp',
      'images/products/console-cream-angle.webp'
    ],
    aiProduct: 'console-green',
    modelScale: 0.84,
    cameraOrbit: '32deg 70deg 1.65m',
    cameraTarget: '0m 0.45m 0m',
    fieldOfView: '28deg',
    keywords: ['giriş', 'koridor', 'salon', 'dekor'],
    variants: [
      {
        id: 'green',
        label: 'Yeşil',
        swatch: '#4b8d52',
        model: 'models/store-console-green.glb?v=20260725-store1',
        poster: 'images/products/console-green-standalone.webp',
        hero: 'images/products/console-green-lifestyle.webp',
        aiProduct: 'console-green'
      },
      {
        id: 'cream',
        label: 'Krem',
        swatch: '#d7d0bd',
        model: 'models/store-console-cream.glb?v=20260725-store1',
        poster: 'images/products/console-cream-lifestyle.webp',
        hero: 'images/products/console-cream-lifestyle.webp',
        aiProduct: 'console-cream'
      }
    ]
  },
  {
    id: 'table-blue',
    name: 'Kobalt Seramik Masa',
    shortName: 'Seramik Masa',
    category: 'table',
    categoryLabel: 'Masa',
    badge: 'İki Parça Montaj',
    price: 54900,
    tagline: 'Heykelsi form, güçlü kobalt yüzey.',
    description: 'Kare tabla ve merkez ayak formu, el işçiliği seramik kaplamayla güçlü bir yemek ve yaşam alanı objesine dönüşür. Tabla ve ayak iki parça teslim edilir.',
    dimensions: '91 × 91 × 76h cm',
    weight: '70 kg',
    coating: 'Seramik',
    frame: 'Ahşap',
    use: 'Sadece iç mekân',
    care: 'Nemli bezle silinebilir',
    model: 'models/store-table-blue.glb?v=20260725-store1',
    poster: 'images/products/table-blue-standalone.webp',
    hero: 'images/products/table-blue-lifestyle.webp',
    gallery: [
      'images/products/table-blue-lifestyle.webp',
      'images/products/table-blue-standalone.webp',
      'images/products/table-blue-detail.webp'
    ],
    aiProduct: 'table-blue',
    modelScale: 0.8,
    cameraOrbit: '35deg 68deg 2.15m',
    cameraTarget: '0m 0.38m 0m',
    fieldOfView: '28deg',
    keywords: ['yemek', 'salon', 'masa', 'mutfak'],
    variants: []
  },
  {
    id: 'nightstand-green',
    name: 'Mozaik Komidin',
    shortName: 'Komidin',
    category: 'nightstand',
    categoryLabel: 'Komidin',
    badge: 'İki Çekmeceli',
    price: 35900,
    tagline: 'Yatak yanında renkli ve işlevsel bir obje.',
    description: 'Kompakt küp gövde, iki çekmeceli depolama ve küçük kare mozaiklerin güçlü renk etkisini bir araya getirir.',
    dimensions: '38 × 38 × 54h cm',
    weight: '40 kg',
    coating: 'Seramik / Cam Mozaik',
    frame: 'Ahşap',
    use: 'Sadece iç mekân',
    care: 'Nemli bezle silinebilir',
    model: 'models/store-nightstand-green.glb?v=20260725-store1',
    poster: 'images/products/nightstand-green-standalone.webp',
    hero: 'images/products/nightstand-green-lifestyle.webp',
    gallery: [
      'images/products/nightstand-green-lifestyle.webp',
      'images/products/nightstand-green-standalone.webp',
      'images/products/nightstand-green-open.webp',
      'images/products/nightstand-green-front-open.webp'
    ],
    aiProduct: 'nightstand-green',
    modelScale: 0.8,
    cameraOrbit: '32deg 70deg 1.35m',
    cameraTarget: '0m 0.27m 0m',
    fieldOfView: '28deg',
    keywords: ['yatak odası', 'komidin', 'yan sehpa', 'depolama'],
    variants: []
  },
  {
    id: 'mosaic-coffee-table',
    name: 'Mozaik Orta Sehpa',
    shortName: 'Orta Sehpa',
    category: 'coffee-table',
    categoryLabel: 'Orta Sehpa',
    badge: 'Gerçek 3D Model',
    price: 46500,
    tagline: 'Yaşam alanının ortasında canlı bir seramik obje.',
    description: 'Ahşap iç iskelet üzerine seramik veya cam mozaik kaplamalı orta sehpa; sarı ve yeşil renk seçenekleri, canlı 3D ve AR deneyimiyle sunulur.',
    dimensions: '81 × 49 × 38h cm',
    weight: '40 kg',
    coating: 'Seramik / Cam Mozaik',
    frame: 'Ahşap',
    use: 'Sadece iç mekân',
    care: 'Nemli bezle silinebilir',
    model: 'models/mosaic-coffee-table-yellow.glb?v=20260725-store1',
    poster: 'images/products/mosaic-table-yellow-cinema.webp',
    hero: 'images/products/mosaic-table-yellow-lifestyle.webp',
    gallery: [
      'images/products/mosaic-table-yellow-lifestyle.webp',
      'images/products/mosaic-table-yellow-detail.webp',
      'images/products/mosaic-table-green-lifestyle.webp',
      'images/products/mosaic-table-green-detail.webp'
    ],
    aiProduct: 'mosaic-coffee-table',
    modelScale: 0.8,
    cameraOrbit: '28deg 70deg 1.55m',
    cameraTarget: '0m 0.18m 0m',
    fieldOfView: '28deg',
    keywords: ['salon', 'orta sehpa', 'mozaik', 'ar'],
    variants: [
      {
        id: 'yellow',
        label: 'Sarı',
        swatch: '#e1b522',
        model: 'models/mosaic-coffee-table-yellow.glb?v=20260725-store1',
        poster: 'images/products/mosaic-table-yellow-cinema.webp',
        hero: 'images/products/mosaic-table-yellow-lifestyle.webp',
        aiProduct: 'mosaic-coffee-table'
      },
      {
        id: 'green',
        label: 'Yeşil',
        swatch: '#5d9562',
        model: 'models/mosaic-coffee-table-green.glb?v=20260725-store1',
        poster: 'images/products/mosaic-table-green-cinema.webp',
        hero: 'images/products/mosaic-table-green-lifestyle.webp',
        aiProduct: 'mosaic-coffee-table'
      }
    ]
  }
];

const PRODUCT_CATEGORIES = [
  { id: 'all', label: 'Tüm Ürünler' },
  { id: 'tv-unit', label: 'TV Ünitesi' },
  { id: 'console', label: 'Dresuar' },
  { id: 'table', label: 'Masa' },
  { id: 'nightstand', label: 'Komidin' },
  { id: 'coffee-table', label: 'Orta Sehpa' }
];

function getProduct(productId) {
  return STORE_PRODUCTS.find((product) => product.id === productId) || STORE_PRODUCTS[0];
}

window.YANAR_STORE = { STORE_PRODUCTS, PRODUCT_CATEGORIES, getProduct };
})();
