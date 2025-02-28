# NODE CACHING MYSQL CONNECTOR WITH REDIS

MySQL bağlantılarınızı yönetirken ve sorgu sonuçlarını Redis ile önbelleğe alarak uygulamanızın performansını artıran bir Node.js kütüphanesi.

## Özellikler

- MySQL sorgu sonuçlarının Redis'te otomatik önbelleğe alınması
- Sayfalama desteği ile önbellekleme
- Veri güncellemeleri için önbellek temizleme
- Anahtar çakışmalarını önlemek için isim alanı (namespace) desteği
- Parametreli sorgular ile SQL injection koruması

## Kurulum

```bash
npm install node-caching-mysql-connector-with-redis
```

## Yapılandırma

Ortam değişkenlerinizi `.env` dosyasında ayarlayın:

```
# MySQL Veritabanı Değişkenleri
DB_HOST="localhost"
DB_USERNAME="root"
DB_PASSWORD=""
DB_NAME="veritabani_adiniz"
DB_PORT="3306"
TIMEZONE="+00:00"  # Varsayılan zaman dilimi

# Redis Değişkenleri
REDIS_SERVER="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_VHOST="uygulamam"  # İsteğe bağlı Redis anahtar öneki
```

## Kullanım Kılavuzu

### Temel Önbellekli Sorgu

`getCacheQuery` fonksiyonu, SQL sorgularını çalıştırır ve sonuçları Redis'te önbelleğe alarak sonraki çağrılarda performansı artırır.

#### Fonksiyon İmzası

```javascript
getCacheQuery(sql, parameters, cacheName)
```

- `sql`: Parametreli yer tutucular (?) içeren SQL sorgu metni
- `parameters`: Yer tutucuları değiştirecek parametre değerlerinin dizisi
- `cacheName`: Önbellekteki sonuç için benzersiz tanımlayıcı

#### Örnek

```javascript
const { getCacheQuery } = require('mysql-redis-connector');

// Belirli bir şirketin tüm kullanıcılarını getir
getCacheQuery(
  "SELECT * FROM users WHERE company_id = ?", 
  [companyId], 
  `userlist-${companyId}`
)
.then(data => {
  // Veriyi işle
  console.log(data);
})
.catch(err => {
  console.error(err);
});
```

### Sayfalama ile Önbellekli Sorgu

`getCacheQueryPagination` fonksiyonu, sorgu sonuçlarının otomatik önbellekleme ile sayfalanmasını sağlar.

#### Fonksiyon İmzası

```javascript
getCacheQueryPagination(sql, parameters, cacheName, page, pageSize = 30)
```

- `sql`: Parametreli yer tutucular (?) içeren SQL sorgu metni
- `parameters`: Yer tutucuları değiştirecek parametre değerlerinin dizisi
- `cacheName`: Önbellekteki sonuç için benzersiz tanımlayıcı
- `page`: Sayfa numarası (0 tabanlı indeks)
- `pageSize`: Sayfa başına öğe sayısı (varsayılan: 30)

#### Örnek

```javascript
const { getCacheQueryPagination } = require('mysql-redis-connector');

// Ürünlerin sayfalanmış listesini getir
getCacheQueryPagination(
  "SELECT * FROM products WHERE category = ? ORDER BY created_at DESC",
  [categoryId],
  `products-category-${categoryId}-page-${page}`,
  page,
  25  // Sayfa başına 25 öğe
)
.then(result => {
  // Şunları içeren bir nesne döndürür:
  // - totalCount: toplam kayıt sayısı
  // - pageCount: toplam sayfa sayısı
  // - detail: istenen sayfa için kayıt dizisi
  console.log(`Gösterilen sayfa: ${page + 1} / ${result.pageCount}`);
  console.log(`Toplam kayıt: ${result.totalCount}`);
  console.log(result.detail);
})
.catch(err => {
  console.error(err);
});
```

### Veri Güncelleme ve Önbellek Temizleme

`QuaryCache` fonksiyonu, yazma işlemlerini (INSERT, UPDATE, DELETE) gerçekleştirir ve ilgili önbellek girişlerini geçersiz kılar.

#### Fonksiyon İmzası

```javascript
QuaryCache(sql, parameters, resetCacheName = null)
```

- `sql`: Parametreli yer tutucular (?) içeren SQL sorgu metni
- `parameters`: Yer tutucuları değiştirecek parametre değerlerinin dizisi
- `resetCacheName`: Geçersiz kılınacak önbellek anahtarı deseni (isteğe bağlı)

#### Örnek

```javascript
const { QuaryCache } = require('mysql-redis-connector');

// Yeni bir kullanıcı ekle ve kullanıcı listesi önbelleğini temizle
QuaryCache(
  "INSERT INTO users SET fullname = ?, email = ?, password = ?, company_id = ?",
  [fullname, email, hashedPassword, companyId],
  `userlist-${companyId}` // Bu desen ile eşleşen tüm anahtarları temizler
)
.then(result => {
  console.log(`Kullanıcı eklendi, ID: ${result.insertId}`);
})
.catch(err => {
  console.error(err);
});
```

## Redis İsim Alanı (Namespace)

Kütüphane, `REDIS_VHOST` ortam değişkeni aracılığıyla Redis anahtar isim alanını destekler. Bu, birden fazla uygulama aynı Redis örneğini paylaştığında anahtar çakışmalarını önler.

`REDIS_VHOST` ayarlandığında, tüm anahtarlar otomatik olarak `{REDIS_VHOST}:` öneki ile başlar. Örneğin, `REDIS_VHOST=uygulamam` ile `userlist-123` adlı bir önbellek anahtarı, Redis'te `uygulamam:userlist-123` olarak saklanır.

## Hata Yönetimi

Tüm fonksiyonlar Promise döndürür, böylece `.then()/.catch()` ile Promise zincirleri veya async/await sözdizimini kullanabilirsiniz:

```javascript
// async/await kullanımı
async function getUserData(companyId) {
  try {
    const users = await getCacheQuery(
      "SELECT * FROM users WHERE company_id = ?",
      [companyId],
      `userlist-${companyId}`
    );
    return users;
  } catch (error) {
    console.error("Kullanıcılar getirilemedi:", error);
    throw error;
  }
}
```

## En İyi Uygulamalar

1. **Anlamlı Önbellek Anahtarları Seçin**: Önbellek anahtarlarınızı benzersiz kılmak için tanımlayıcılar ekleyin (örn. `products-category-${categoryId}`).

2. **Uygun Son Kullanma Süreleri Ayarlayın**: Varsayılan önbellek süresi 40.000 saniyedir (~11 saat). Veri değişkenliğinize göre bu süreyi ayarlayın.

3. **Önbellek Temizlemeyi Yönetin**: Veri değişikliklerinden sonra, önbellekteki verileri güncel tutmak için uygun önbellek desenleriyle `QuaryCache` fonksiyonunu çağırın.

4. **İsim Alanlarını Kullanın**: Paylaşılan Redis ortamlarında anahtar çakışmalarını önlemek için `REDIS_VHOST` ortam değişkenini ayarlayın.

5. **Her Zaman Parametreli Sorgular Kullanın**: SQL enjeksiyon saldırılarını önlemek için değerleri asla doğrudan SQL metinlerine birleştirmeyin.

## Lisans

MIT

## Gelecek Yol Haritası

Kütüphanenin gelecek versiyonlarında planlanan geliştirmeler:

1. **Redis Cluster Desteği**: Yüksek kullanılabilirlik ve ölçeklenebilirlik için Redis Cluster desteği.

2. **Otomatik Önbellek Yenileme**: Belirli bir süre sonra otomatik olarak önbelleği arka planda yenileme özelliği.

3. **İzleme ve Metrikler**: Önbellek isabet oranı, sorgu performansı ve Redis durum metrikleri için izleme araçları.

4. **Dağıtılmış Kilit Mekanizması**: Eşzamanlı istemciler arasında veri tutarlılığını sağlamak için dağıtılmış kilit desteği.

5. **Şema Değişikliği Yönetimi**: Veritabanı şeması değişikliklerinde önbelleği otomatik temizleme mekanizması.

6. **TypeScript Desteği**: Tam TypeScript tiplerini ve desteklerini içeren TypeScript sürümü.

7. **İnce Ayarlı Önbellek Stratejileri**: LRU, TTL, FIFO gibi farklı önbellekleme stratejileri arasında seçim yapma olanağı.

8. **Olay Tabanlı Önbellek Geçersiz Kılma**: Uygulama olaylarına dayalı otomatik önbellek geçersiz kılma sistemi.

## GitHub Deposu

[https://github.com/hayatialikeles/NODE-CACHING-MYSQL-CONNECTOR-WITH-REDIS](https://github.com/hayatialikeles/NODE-CACHING-MYSQL-CONNECTOR-WITH-REDIS)