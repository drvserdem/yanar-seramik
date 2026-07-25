# Yanar Seramik — Yapay Zekâ Seramik Stüdyosu Test Raporu

## Kapsam

- Ana sayfa, hizmet görselleri, önce/sonra alanı, 3D sehpa ve iPhone/Android “Evinde Gör” akışı korundu.
- Eski dört köşeyi sürükleme tabanlı canlı kaplama motoru kaldırıldı.
- `canli-seramik.html`, fotoğraf tabanlı Yapay Zekâ Seramik Stüdyosu olarak yeniden geliştirildi.
- Vercel Function: `api/render-ceramic.js`

## Tamamlanan kontroller

- Node.js sözdizimi: `api/render-ceramic.js` ve `js/tile-studio.js`
- HTML içindeki yerel CSS, JavaScript, görsel, model ve sayfa yolları
- Yinelenen HTML kimlikleri ve JavaScript tarafından kullanılan eleman kimlikleri
- Eski dört nokta/canvas sistemi kalıntıları
- API anahtarının yalnızca sunucu tarafında `process.env.OPENAI_API_KEY` ile okunması
- İstemci tarafında JPG/PNG/WebP doğrulaması ve mobil görsel küçültme
- Sunucu tarafında dosya türü, dosya boyutu, istek yöntemi ve seçenek doğrulaması
- Eksik/geçersiz API anahtarı, yetki, organizasyon doğrulaması, büyük fotoğraf, desteklenmeyen dosya, zaman aşımı, hız limiti ve kredi/bakiye hata eşlemesi
- `gpt-image-2` için yasak olan `input_fidelity` parametresinin gönderilmemesi
- Model erişim hatasında `gpt-image-2` → `gpt-image-1.5` → `gpt-image-1` otomatik geri dönüş testi
- Uyumsuz `output_compression` veya `input_fidelity` parametresinde tek seferlik uyumluluk tekrar denemesi
- Başarılı OpenAI yanıtı, kullanılan model ve istek kimliği işleme testi
- Masaüstü ve 390 px mobil tarayıcı görünümü
- Fotoğraf yükleme, seçim özeti, açık onay, render isteği, sonuç ekranı ve WhatsApp mesajı uçtan uca tarayıcı testi

## Dağıtım notu

Vercel’de `OPENAI_API_KEY` Production ve Preview ortamlarında tanımlı olmalıdır. İsteğe bağlı `OPENAI_IMAGE_MODEL` tek model veya virgülle ayrılmış sıra kabul eder. Tanımlanmadığında Function sırasıyla `gpt-image-2`, `gpt-image-1.5` ve `gpt-image-1` modellerini dener. API anahtarı hiçbir HTML veya tarayıcı JavaScript dosyasına eklenmemelidir.

Gerçek OpenAI üretim çağrısı, kaynak paket hazırlanırken yerel test ortamında gerçek bir API anahtarı bulunmadığı için çalıştırılmadı. Function’ın istek oluşturması, model geri dönüşü, başarılı yanıt işlemesi ve hata davranışları kontrollü mock yanıtlarla doğrulandı.
