# 3D Ürün ve “Evinde Gör” Kurulumu

Bu sürümde Yanar Seramik ana sayfasına mevcut tasarımı bozmadan bir **3D ürün deneyimi** eklendi. Ayrıca QR kodla açılan ayrı bir ürün sayfası bulunur:

- Ana sayfa ürün bölümü: `https://yanarseramik.com/#urun-3d`
- Tam ekran ürün sayfası: `https://yanarseramik.com/urun-3d.html`
- QR / doğrudan AR girişi: `https://yanarseramik.com/urun-3d.html?ar=1`

## Dosyalar

- `models/mosaic-coffee-table-yellow.glb`
- `models/mosaic-coffee-table-green.glb`
- `urun-3d.html`
- `js/product-3d.js`
- `images/products/evinde-gor-qr.png`

## AR çalışma şekli

- Android: WebXR veya Google Scene Viewer
- iPhone / iPad: Apple Quick Look
- Desteklenmeyen cihaz: Normal 3D görüntüleyici

Model gerçek katalog ölçülerinde hazırlanmıştır: **81 × 49 × 38 cm**. `ar-scale="fixed"` kullanıldığı için AR modunda ürünün ölçeği sabit tutulur.

## Yayına alma

1. Bu klasördeki dosyaları mevcut `yanar-seramik` proje klasörüne kopyalayın.
2. GitHub Desktop içinde değişiklikleri commit edin.
3. `Push origin` yapın.
4. Vercel otomatik olarak yeni sürümü yayınlar.
5. Telefonla `https://yanarseramik.com/urun-3d.html?ar=1` adresini açıp test edin.

## Gerçek ürün modeli hakkında

3D model, gönderilen ürün fotoğrafları ve katalog ölçüleri temel alınarak yeniden oluşturulmuş dijital bir temsildir. Ürünün formu, açık raf yapısı, mozaik kaplaması ve gerçek ölçüsü modellenmiştir. El yapımı tile düzensizlikleri, renk tonu ve ışık yansımaları fiziksel üründe farklılık gösterebilir.
