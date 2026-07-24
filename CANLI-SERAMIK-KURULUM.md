# Yanar Seramik Canlı Seramik Stüdyosu

## Yeni sayfa

- `canli-seramik.html`
- Canlı motor: `js/tile-studio.js`
- Sayfa tasarımı: `css/tile-studio.css`
- QR: `images/canli-seramik-qr.png`

## Çalışma şekli

1. Kullanıcı **Kamerayı Aç** butonuna dokunur.
2. Tarayıcı arka kamera için izin ister.
3. Kullanıcı **Duvar** veya **Zemin** modunu seçer.
4. Dört köşe noktası, kaplanacak yüzeyin köşelerine taşınır.
5. Seramik koleksiyonu, ebat, döşeme düzeni, derz rengi ve derz kalınlığı anlık değiştirilir.
6. Görünüm cihazda kaydedilebilir veya paylaşım menüsü üzerinden WhatsApp'a gönderilebilir.

## Neden dört köşe kalibrasyonu kullanılıyor?

Tarayıcı içinde manuel dört köşe kalibrasyonu, farklı iPhone ve Android modellerinde daha kararlı sonuç verir. Yüzeyin gerçek perspektifi bu dört noktadan hesaplanır. Bu sürüm otomatik yapay zekâ duvar segmentasyonu kullanmaz.

## Kamera şartları

- Sayfa HTTPS üzerinden açılmalıdır. Vercel bunu otomatik sağlar.
- Kamera, kullanıcı butona dokunduktan sonra açılır.
- iPhone'da video öğesinde `playsinline`, `muted` ve `autoplay` kullanılır.
- Instagram/WhatsApp içi tarayıcı sorun çıkarırsa bağlantı Safari'de açılmalıdır.
- `vercel.json` içinde `Permissions-Policy: camera=(self)` başlığı bulunur.

## Test adresi

Yayınlandıktan sonra:

`https://yanarseramik.com/canli-seramik.html`

## Önemli ticari not

Canlı stüdyo, müşterinin tasarım kararını kolaylaştıran bir önizleme aracıdır. Nihai renk tonu, gerçek seramik dokusu, metraj, fire oranı, yüzey hazırlığı ve uygulama detayları yerinde keşifle netleştirilmelidir.
