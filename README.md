# Yanar Seramik Web Sitesi — 3D / AR PBR Sürümü

Bu sürüm mevcut Yanar Seramik tasarımını korur ve şu iyileştirmeleri içerir:

- Gerçek ölçülü 81 × 49 × 38 cm mozaik sehpa
- Sarı ve yeşil renk seçenekleri
- Fotoğraflardaki sırlı seramik ve derz görünümünü baz alan PBR malzemeler
- GLB web/Android modelleri
- iPhone için doğrudan USDZ / Apple Quick Look desteği
- `canActivateAR` sonucuna bağlı kalmadan güvenli iPhone açılışı
- Uygulama içi tarayıcı ve HTTPS uyarıları
- Vercel MIME başlıkları ve önbellek sürümleme
- Önce / sonra dönüşüm sürgüsü

## Yayınlama

Dosyaları mevcut GitHub klasörüne kopyalayın. GitHub Desktop'ta commit ve push yaptıktan sonra Vercel otomatik yayınlar.

## Test

- iPhone: Safari'de `urun-3d.html?ar=1`
- Android: Chrome'da aynı adres
- Masaüstü: 3D model döndürme, renk seçimi ve QR kod


## Canlı Seramik Stüdyosu

Yeni `canli-seramik.html` sayfası, uygulama indirmeden telefon kamerası üzerinden duvar ve zemin seramiği önizlemesi sunar.

Özellikler:
- iPhone ve Android tarayıcılarında arka kamera erişimi
- Duvar ve zemin için ayrı perspektif başlangıçları
- Dört köşe noktasıyla yüzey kalibrasyonu
- 5×5 cm ile 120×120 cm arasında seramik ebatları
- Düz, şaşırtmalı, dikey ve ton geçişli döşeme
- Seramik koleksiyonu, özel renk, derz rengi ve derz kalınlığı
- Görünümü cihazda kaydetme veya paylaşım ekranından WhatsApp'a gönderme
- Seçim bilgilerini WhatsApp teklif mesajına aktarma

Kamera özelliği HTTPS gerektirir. Vercel yayını bu koşulu otomatik sağlar. Instagram veya WhatsApp içi tarayıcı sorun çıkarırsa sayfa Safari/Chrome içinde açılmalıdır.
