# Yanar Seramik 3D / AR Kurulumu

## iPhone / iPad

- Site, Apple AR Quick Look için doğrudan `.usdz` dosyaları kullanır.
- Sarı ve yeşil ürün için ayrı USDZ dosyası vardır.
- “Kamerayı Aç ve Başlat” düğmesi iPhone'da `rel="ar"` bağlantısını tetikler.
- Instagram veya WhatsApp içi tarayıcıda açılmazsa bağlantı Safari'de açılmalıdır.
- AR yalnızca HTTPS üzerinde çalışır. Vercel yayını bu koşulu sağlar.

## Android

- GLB dosyası WebXR veya Google Scene Viewer ile açılır.
- `model-viewer` AR modu doğrudan başlatılır.

## Gerçek ölçü

Model dış ölçüsü 81 × 49 × 38 cm olarak hazırlanmıştır ve AR ölçeği sabittir.

## Dosyalar

- `models/mosaic-coffee-table-yellow.glb`
- `models/mosaic-coffee-table-green.glb`
- `models/mosaic-coffee-table-yellow.usdz`
- `models/mosaic-coffee-table-green.usdz`
- `vercel.json`: GLB ve USDZ MIME başlıklarını tanımlar.

## Sorun giderme

1. Sayfayı doğrudan Safari veya Chrome'da açın.
2. Site adresinin `https://` ile başladığını kontrol edin.
3. Eski sürüm görünüyorsa Safari geçmişi/site verisini temizleyin veya sayfayı yeniden yükleyin.
4. iPhone'da AR açılmazsa modal içindeki “iPhone için doğrudan AR aç” bağlantısını kullanın.
5. Daha aydınlık ve desenli bir zeminde telefonu yavaşça hareket ettirin.
