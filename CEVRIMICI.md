# Çevrimiçi Cluedo: her oyuncu kendi cihazından

Bu klasördeki sunucu, oyuncuların farklı bilgisayar ve telefonlardan aynı oyuna katılmasını sağlar.
Kartları ve zarftaki çözümü sunucu tutar; hiçbir oyuncunun tarayıcısına başkasının kartı gönderilmez.

## Nasıl oynanır

1. Bir oyuncu siteyi açar, adını yazar ve **Oda Kur**'a basar. 4 harfli bir oda kodu ve davet linki çıkar.
2. Diğer oyuncular linki açar (ya da kodu girer) ve adlarını yazıp katılır.
3. Herkes lobide karakterini seçer. Oda sahibi en az 3 oyuncu olunca **Oyunu Başlat**'a basar.
4. Sayfayı yenileyen ya da bağlantısı kopan oyuncu aynı tarayıcıdan tekrar açınca kaldığı yerden devam eder.
   Bağlantısı kopan oyuncunun sırası geldiğinde oda sahibi sırasını geçebilir; kart göstermesi gerekirse sunucu otomatik gösterir.

Herkes aynı cihazdaysa `/tek-cihaz` adresindeki eski sürüm hâlâ kullanılabilir.

## Bilgisayarınızda çalıştırma

Node.js 18 veya üstü gerekir.

```bash
npm install
npm start
```

Ardından tarayıcıda `http://localhost:3000` adresini açın. Aynı ağdaki başka cihazlar `http://<bilgisayarınızın-ip-adresi>:3000` ile katılabilir.

## İnternette yayınlama (Render)

1. https://render.com adresinde ücretsiz bir hesap açın ve GitHub hesabınızı bağlayın.
2. **New > Blueprint** seçin ve bu depoyu işaretleyin. `render.yaml` dosyası ayarları otomatik yapar.
3. Kurulum bitince Render size `https://cluedo-cevrimici.onrender.com` gibi bir adres verir; oyuncular bu adresten oynar.

Not: Render'ın ücretsiz planında sunucu 15 dakika kullanılmazsa uykuya geçer; ilk açılış yaklaşık 1 dakika sürebilir
ve uyku sırasında devam eden odalar silinir. Satışa açmadan önce ücretli plana geçmeniz önerilir.

## Dosyalar

| Dosya | Ne işe yarar |
| --- | --- |
| `shared/data.js` | Oyunun adı, karakterler, silahlar, odalar ve tahta. **İsimleri değiştirmek için yalnızca bu dosyayı düzenleyin.** |
| `server/game.js` | Oyun kuralları ve gizli bilgiler (sunucuda çalışır) |
| `server/server.js` | Web sunucusu ve oda yönetimi |
| `public/` | Oyuncuların tarayıcısında çalışan sayfa |
| `images/odalar/` | Oda görselleri |

## Satıştan önce

- "Cluedo" / "Clue" adı ile Bayan Scarlett, Albay Mustard gibi karakter adları Hasbro'nun tescilli markalarıdır.
  Ticari satıştan önce `shared/data.js` içindeki `TITLE`, `CHARACTERS` ve sayfa başlıklarını özgün adlarla değiştirin.
- Oda görsellerinin ve kullanılacak müziğin ticari kullanım hakkına sahip olduğunuzdan emin olun.
