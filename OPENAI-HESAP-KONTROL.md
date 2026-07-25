# OpenAI Görüntü Modeli Erişim Kontrolü

Sitede `ORG_VERIFICATION_REQUIRED`, `KEY_PERMISSION_DENIED` veya `MODEL_UNAVAILABLE` görülürse aşağıdaki ayarlar kontrol edilmelidir:

1. OpenAI Platform’da sitenin API anahtarının oluşturulduğu doğru Organization ve Project seçilir.
2. Organization → General → Verify Organization adımı tamamlanır.
3. Doğrulama sonrasında yeni bir Project API Key oluşturulur.
4. Anahtar izni `All` yapılır. Restricted kullanılacaksa Images uç noktasına istek/yazma izni verilir.
5. Project → Limits / Model Usage alanında GPT Image modellerinin kullanımına izin verildiği kontrol edilir.
6. Yeni anahtar Vercel → Project Settings → Environment Variables içindeki `OPENAI_API_KEY` değerine yazılır.
7. Production ve Preview seçilir, ardından yeni deployment alınır.

`OPENAI_IMAGE_MODEL` zorunlu değildir. Function erişime göre `gpt-image-2`, `gpt-image-1.5` ve `gpt-image-1` modellerini otomatik dener.
