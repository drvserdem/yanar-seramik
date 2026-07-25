# Yanar Digital Twin — 3D ve AR Notları

## Doğruluk yaklaşımı
3D model, ürün fotoğrafları ve 81 × 49 × 38 cm gerçek ürün ölçüsü referans alınarak hazırlanmış dijital temsildir. GLB ve USDZ dosyalarında fiziksel ölçü sabittir; AR içinde `ar-scale="fixed"` kullanılır.

Tek bir fotoğraftan yapılan yapay zekâ üretimi fiziksel ürünü milimetrik olarak garanti edemez. Bu nedenle sitede yapay bir 2D ürün görseli yerine mevcut ölçülü GLB/USDZ dijital ikiz kullanılmış, gerçek ürün fotoğrafları işçilik kanıtı olarak ayrıca korunmuştur.

## Cihaz akışı
- iPhone/iPad: Apple Quick Look (`.usdz`)
- Android: Scene Viewer veya WebXR (`.glb`)
- Masaüstü: canlı 3D model + telefon için QR

## Ana dosyalar
- `index.html`: tam genişlikte sinematik ana sayfa sahnesi
- `urun-3d.html`: tam ekran ürün deneyimi
- `js/product-3d.js`: model değiştirme, yükleme durumu ve doğrudan AR başlatma
- `css/style.css`: sinematik katmanlar ve mobil uyarlamalar
