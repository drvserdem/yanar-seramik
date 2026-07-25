# Yapay Zekâ Seramik Stüdyosu — Kurulum

## Dosyalar

- Sayfa: `canli-seramik.html`
- Tarayıcı uygulaması: `js/tile-studio.js`
- Sayfa tasarımı: `css/tile-studio.css`
- Vercel Function: `api/render-ceramic.js`
- Vercel ayarı: `vercel.json`

## Ortam değişkenleri

Vercel projesinde aşağıdaki değişken sunucu tarafında tanımlı olmalıdır:

- `OPENAI_API_KEY` — zorunlu, Sensitive olarak Production ve Preview ortamlarında.
- `OPENAI_IMAGE_MODEL` — isteğe bağlı. Tek model veya virgülle ayrılmış model sırası yazılabilir. Tanımlanmazsa Function sırasıyla `gpt-image-2`, `gpt-image-1.5` ve `gpt-image-1` modellerini dener.

API anahtarı HTML veya tarayıcı JavaScript dosyalarına yazılmaz. Yalnızca Vercel Function içindeki `process.env.OPENAI_API_KEY` üzerinden okunur.

## OpenAI hesap gereksinimleri

GPT Image modelleri bazı hesaplarda API Organization Verification gerektirir. OpenAI Platform içinde doğru organizasyon ve proje seçilerek:

1. Organization → General bölümündeki doğrulama tamamlanmalıdır.
2. Project → API Keys bölümündeki anahtar `All` yetkili olmalı veya Restricted kullanımda Images uç noktasına yazma izni verilmelidir.
3. Project → Limits / Model Usage bölümünde GPT Image modelleri devre dışı bırakılmamalıdır.
4. Doğrulamadan sonra yeni bir API anahtarı oluşturulup Vercel’deki `OPENAI_API_KEY` güncellenmeli ve yeni deployment alınmalıdır.

## Çalışma akışı

1. Kullanıcı kamerayla fotoğraf çeker veya galeriden JPG, PNG ya da WebP seçer.
2. Fotoğraf tarayıcıda en fazla 1800 piksel kenara ve yaklaşık 2,7 MB hedef boyuta küçültülür.
3. Seçimler ve küçültülmüş fotoğraf `POST /api/render-ceramic` adresine multipart form olarak gönderilir.
4. Function, OpenAI Images Edit API’ye sunucu tarafından bağlanır.
5. `gpt-image-2` kullanılırken `input_fidelity` gönderilmez; bu model giriş görsellerini otomatik olarak yüksek sadakatle işler. Eski GPT Image modellerinde yüksek sadakat parametresi kullanılır.
6. Sonuç tarayıcıda önce-sonra sürgüsü, indirme ve WhatsApp teklif akışıyla gösterilir.

Fotoğraflar proje dosya sistemine, veritabanına veya kalıcı depolamaya yazılmaz. İstek süresince bellekte işlenir ve tasarım üretimi için OpenAI API’ye gönderilir.

## Vercel sınırı

Vercel Function istek ve yanıt gövdesi sınırına yaklaşmamak için fotoğraf istemcide küçültülür. Function ayrıca içerik uzunluğunu ve dosya boyutunu doğrular; büyük isteklerde `413 PAYLOAD_TOO_LARGE` döndürür.

## Yerel kontrol

```bash
npm run check
```

Gerçek görüntü üretimi için yerel ortamda `OPENAI_API_KEY` tanımlanmalı ve site Vercel uyumlu bir geliştirme sunucusunda çalıştırılmalıdır.
