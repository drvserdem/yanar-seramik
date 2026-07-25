# Yanar Seramik Mağaza ve AR Altyapısı

## Yeni sayfalar

- `magaza.html`: ürün kataloğu, filtreler, ürün arama, AR hızlı görünüm, yapay zekâ ürün rehberi ve teklif listesi.
- `urun.html?product=...`: veri tabanlı ürün detay sayfası. Aynı şablon tüm ürünler için kullanılır.

## Ürün verileri

Tüm mağaza bilgileri `js/store-data.js` dosyasındaki `STORE_PRODUCTS` dizisinden yönetilir. Yeni ürün eklerken ürün adı, görseller, ölçüler, model yolu ve yapay zekâ ürün kodu buraya eklenir.

## AR modelleri

- Mevcut mozaik orta sehpa modelleri korunmuştur.
- TV ünitesi, dresuar, masa ve komidin için ölçülere ve ürün fotoğraflarına göre hazırlanmış hafif GLB sunum modelleri eklenmiştir.
- `<model-viewer>` iPhone için USDZ dosyasını otomatik üretir; Android'de WebXR/Scene Viewer kullanılır.
- `ar-scale="auto"` kullanılır. Ürün açılış ölçeği küçültülmüş, kullanıcı iki parmakla büyütüp küçültebilir.

Profesyonel fotogrametri veya CAD modeli hazırlandığında yalnızca ilgili `.glb` dosyası aynı dosya adıyla değiştirilerek daha yüksek doğruluk elde edilir; mağaza kodunun değiştirilmesi gerekmez.

## Teklif listesi

`js/store-cart.js` ürünleri tarayıcıdaki `localStorage` alanında tutar. Bu yapı ileride fiyat, stok, gerçek sepet ve ödeme sistemi eklenmesine hazırdır. Şu an liste WhatsApp toplu teklif mesajı oluşturur.

## Yapay zekâ yerleştirme

Mağazadaki “Mekânımda Dene” düğmeleri `canli-seramik.html?mode=product&product=...` adresine gider. Krem ve yeşil dresuar dahil tüm mevcut ürün seçenekleri yapay zekâ stüdyosuna bağlanmıştır.

## Vercel

Mevcut `OPENAI_API_KEY` ve `OPENAI_IMAGE_MODEL` ortam değişkenleri korunur. Yeni mağaza ve AR sayfaları statik dosyalardır; ek ortam değişkeni gerekmez.
