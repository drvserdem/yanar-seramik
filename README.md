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



## Yapay Zekâ Seramik Stüdyosu

`canli-seramik.html`, fotoğraf yükleme veya kamera çekimi üzerinden çalışan yapay zekâ destekli seramik önizleme sayfasıdır. Mobil fotoğraf tarayıcıda küçültülür; seramik modeli, ölçüsü, döşeme biçimi, yüzey ve derz seçimleri `api/render-ceramic.js` Vercel Function'ına gönderilir. API anahtarı yalnızca `process.env.OPENAI_API_KEY` üzerinden sunucuda kullanılır.

Ayrıntılı kurulum: `CANLI-SERAMIK-KURULUM.md`


## Sürüm 2.1 — Model erişim düzeltmesi

OpenAI görüntü modeli erişimi için otomatik model geri dönüşü eklendi. `gpt-image-2` kullanılırken artık desteklenmeyen `input_fidelity` parametresi gönderilmez. Hesap doğrulama ve API anahtarı izin adımları için `OPENAI-HESAP-KONTROL.md` dosyasına bakın.
