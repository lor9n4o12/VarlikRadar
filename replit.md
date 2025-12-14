# Türk Yatırım Portföy Takip Platformu

## Proje Genel Bakış

Kullanıcıların Borsa İstanbul hisseleri, ABD hisseleri, ETF'ler, kripto paralar ve gayrimenkul varlıklarını yönetip takip edebileceği Türkçe bir yatırım ve portföy takip platformu. Yahoo Finance ve Investing.com'dan ilham alınarak tasarlanmıştır.

### Temel Özellikler
- **Dashboard (Portföyüm)**: Net değer gösterimi, varlık dağılım grafikleri, aylık performans grafikleri ve varlık listesi
- **İşlemler**: Alım/satım işlemlerini kaydetme ve görüntüleme
- **Bütçe Takibi**: Gelir ve gider takibi, kategori bazlı dağılım grafikleri, bakiye hesaplama
- **Raporlar**: Detaylı performans raporları ve analizler
- **Ayarlar**: Platform ayarları ve kullanıcı tercihleri

### Teknoloji Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query v5)
- **Form Handling**: react-hook-form + Zod validation
- **Charts**: Recharts
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Storage**: DatabaseStorage (persistent data)

## Son Güncellemeler (14 Aralık 2025)

### Bütçe Takibi Özelliği (YENİ!)
1. ✅ **Bütçe Sayfası**: /butce - Gelir ve gider yönetimi
2. ✅ **Gelir Kategorileri**: maaş, kira, temettü, faiz, serbest, diğer
3. ✅ **Gider Kategorileri**: market, faturalar, ulaşım, sağlık, eğlence, giyim, yemek, kira, kredi, sigorta, diğer
4. ✅ **Özet Kartlar**: Toplam Gelir, Toplam Gider, Bakiye
5. ✅ **Pasta Grafikler**: Gelir ve gider dağılımı kategori bazlı
6. ✅ **CRUD İşlemleri**: Gelir/gider ekleme ve silme
7. ✅ **Sidebar Navigasyon**: "Bütçe" menü öğesi eklendi
8. ✅ **E2E Test**: Tüm işlevler test edildi ve onaylandı

### Çoklu Para Birimi Görüntüleme
1. ✅ **Ayarlar Sayfası**: TRY, USD, EUR, BTC, ETH, Gram Altın seçenekleri
2. ✅ **Currency Context**: client/src/lib/currency-context.tsx - Global currency state
3. ✅ **Exchange Rates API**: GET /api/exchange-rates - Döviz kurları (Yahoo Finance + Binance)
4. ✅ **Dashboard Dönüşümü**: Toplam Varlık, Toplam Borç, Net Değer seçilen para biriminde gösterilir
5. ✅ **LocalStorage Persistance**: Seçilen para birimi tarayıcıda saklanır
6. ✅ **Formatlamalar**: BTC/ETH 6 ondalık, Gram Altın 2 ondalık, Fiat para birimleri Türkçe format

### Gerçek Zamanlı Fiyat Güncellemeleri
1. ✅ **Price Service**: server/services/priceService.ts - Binance ve Yahoo Finance API entegrasyonu
2. ✅ **Kripto Fiyatları**: Binance API (BTC, ETH, 1INCH vb. - USDT paritesi)
3. ✅ **BIST Hisseleri**: Yahoo Finance API (.IS suffix - THYAO.IS, GARAN.IS)
4. ✅ **ABD Hisseleri**: Yahoo Finance API (AAPL, TSLA, MSFT vb.)
5. ✅ **Dashboard Butonu**: "Fiyatları Güncelle" butonu ile tek tıkla güncelleme
6. ✅ **Loading States**: Güncelleme sırasında dönen ikon ve disabled state
7. ✅ **Toast Notifications**: Başarı/hata bildirimleri
8. ✅ **Son Güncelleme**: Header'da son güncelleme zamanı gösterimi
9. ✅ **Visual Indicators**: Yeşil/kırmızı trend okları ile fiyat değişimi

### PostgreSQL Database Migration (15 Kasım 2025)
1. ✅ **Database Setup**: Neon PostgreSQL connection (server/db.ts)
2. ✅ **Storage Migration**: MemStorage → DatabaseStorage with Drizzle ORM
3. ✅ **Decimal Field Bug Fix**: parseFloat() → Number() || 0 (NaN prevention)
4. ✅ **Data Persistence**: Tüm varlık ve işlemler database'de saklanıyor
5. ✅ **Transaction Safety**: Asset quantity/averagePrice atomik güncellemeler
6. ✅ **Production Ready**: End-to-end test başarılı, architect approved

## MVP Tamamlandı (15 Kasım 2025)

### Kritik Düzeltmeler
1. ✅ **Missing Endpoint**: `/api/portfolio/details` endpoint eklendi (critical bug fix!)
2. ✅ **API Validation**: PATCH /api/assets endpoint'inde Zod validation eklendi (`insertAssetSchema.partial()`)
3. ✅ **Form Validation**: AddAssetDialog ve AddTransactionDialog react-hook-form + zodResolver kullanıyor
4. ✅ **Error Handling**: Tüm sayfalarda loading skeleton ve error states eklendi
5. ✅ **Portfolio Calculations**: getMonthlyPerformance() gerçek transaction verilerini kullanarak hesaplama yapıyor
6. ✅ **Cache Invalidation**: Transaction ve asset mutations sonrası tüm ilgili query'ler invalidate ediliyor
7. ✅ **Date Validation**: Transaction date field `z.coerce.date()` kullanıyor (string veya Date kabul eder)

### End-to-End Test Sonuçları
✅ Asset oluşturma ve listeleme
✅ Transaction oluşturma ve geçmiş görüntüleme
✅ Portfolio özet metrikleri (Toplam Varlık: ₺28.000 → ₺42.000)
✅ Varlık dağılım grafiği (pie chart)
✅ Aylık performans grafiği (line chart)
✅ Tüm API endpoint'leri (201/200 responses)
✅ Toast notifications
✅ Form validation
✅ Error/loading states

### Architect Final Approval
- **Status: PASS** ✅ ✅ ✅
- MVP production-ready
- Tüm core user flows doğrulandı
- End-to-end test başarıyla geçti
- Güvenlik sorunu yok

## Proje Yapısı

### Önemli Dosyalar

#### Schema & Types
- `shared/schema.ts`: Tüm veri modelleri, Drizzle ORM schema, Zod validation schema'ları

#### Backend
- `server/routes.ts`: Express API routes (CRUD operations, portfolio analytics, price updates)
- `server/storage.ts`: DatabaseStorage implementation (IStorage interface)
- `server/index.ts`: Express server ve Vite middleware
- `server/services/priceService.ts`: Gerçek zamanlı fiyat servisi (Binance + Yahoo Finance)

#### Frontend Pages
- `client/src/pages/dashboard.tsx`: Ana dashboard sayfası (özet kartlar, grafikler, varlık listesi)
- `client/src/pages/transactions.tsx`: İşlem geçmişi sayfası
- `client/src/pages/budget.tsx`: Bütçe takibi sayfası (gelir/gider yönetimi, grafikler)
- `client/src/pages/reports.tsx`: Raporlar sayfası
- `client/src/pages/settings.tsx`: Ayarlar sayfası

#### Frontend Components
- `client/src/components/app-sidebar.tsx`: Sol navigasyon sidebar (Shadcn sidebar)
- `client/src/components/add-asset-dialog.tsx`: Varlık ekleme dialog'u (react-hook-form + Zod)
- `client/src/components/add-transaction-dialog.tsx`: İşlem ekleme dialog'u (react-hook-form + Zod)
- `client/src/components/asset-table.tsx`: Varlıkları listeleyen tablo
- `client/src/components/transaction-table.tsx`: İşlemleri listeleyen tablo
- `client/src/components/asset-allocation-chart.tsx`: Pasta grafik (varlık dağılımı)
- `client/src/components/monthly-performance-chart.tsx`: Çizgi grafik (aylık performans)

#### Styling & Design
- `design_guidelines.md`: Tasarım kuralları ve renk paleti
- `client/src/index.css`: Tailwind config, CSS variables, custom utilities
- `tailwind.config.ts`: Tailwind yapılandırması, renk tokenları

## API Endpoints

### Assets (Varlıklar)
- `GET /api/assets` - Tüm varlıkları listele
- `POST /api/assets` - Yeni varlık ekle (Zod validation)
- `PATCH /api/assets/:id` - Varlık güncelle (Zod validation - partial)
- `DELETE /api/assets/:id` - Varlık sil

### Transactions (İşlemler)
- `GET /api/transactions` - Tüm işlemleri listele
- `POST /api/transactions` - Yeni işlem ekle (Zod validation)
- `DELETE /api/transactions/:id` - İşlem sil

### Portfolio Analytics
- `GET /api/portfolio/summary` - Özet bilgiler (toplam varlık, borç, net değer, aylık değişim)
- `GET /api/portfolio/allocation` - Varlık dağılımı (pasta grafik için)
- `GET /api/portfolio/performance` - Aylık performans (çizgi grafik için)
- `GET /api/portfolio/details` - Detaylı varlık analizi

### Price Updates (Fiyat Güncellemeleri)
- `POST /api/prices/update` - Tüm varlık fiyatlarını güncelle (Binance + Yahoo Finance)
- `GET /api/prices/:symbol` - Tek varlık fiyatını getir (query: type, market)

## Tasarım Sistemi

### Renk Paleti
- **Primary Blue**: #1E3A8A (finansal güvenilirlik)
- **Success Green**: #10B981 (kazançlar)
- **Destructive Red**: #EF4444 (kayıplar)
- **Background**: Açık gri tonları (light mode)
- **Dark Mode**: Tam destekli

### Türkçe Yerelleştirme
- Tüm UI metinleri Türkçe
- Tarih formatı: DD.MM.YYYY
- Para birimi: ₺ (TRY), $ (USD), € (EUR)
- Sayı formatı: Türkçe (binlik ayracı, ondalık virgül)

## Kullanıcı Tercihleri

### Kod Stili
- TypeScript strict mode
- React Hooks + functional components
- Shadcn/ui bileşenleri tercih edilir
- Form handling: react-hook-form + Zod validation
- Data fetching: TanStack Query (v5)
- Error handling: Toast notifications + error states

### Workflow Tercihleri
- Minimal dosya sayısı (benzer componentler tek dosyada)
- Frontend-heavy yaklaşım (backend sadece data persistence)
- In-memory storage (MVP için), production'da Neon PostgreSQL

## Çalıştırma

```bash
npm run dev
```

Uygulama http://localhost:5000 adresinde çalışacaktır.

## Sonraki Adımlar (Opsiyonel)

1. **Otomatik Test Coverage**: Integration testler ekle (analytics refresh davranışı için)
2. **Manuel QA**: Gerçekçi seed data ile edge case'leri test et
3. **Transaction Deletion**: Silme işlemi için backfill logic ekle
4. ~~**Gerçek Zamanlı Fiyatlar**: External API integration~~ ✅ TAMAMLANDI
5. **Multi-Currency Support**: Döviz kurları ile otomatik hesaplama
6. **Export/Import**: Portfolio verilerini CSV/JSON olarak export/import
7. **Otomatik Fiyat Yenileme**: Belirli aralıklarla otomatik güncelleme (polling)

## Notlar

- Tüm mutation'lar ilgili query'leri invalidate ediyor (cache güncel kalıyor)
- Loading skeletons ve error states tüm sayfalarda mevcut
- Form validation client-side ve server-side yapılıyor
- Portfolio calculations gerçek transaction verilerini kullanıyor (mock data yok)
- Architect final review: PASS ✅
