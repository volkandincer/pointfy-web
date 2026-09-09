# TeamHubX Web

TeamHubX web sitesi - Takım işbirliği platformu için landing page ve yasal sayfalar.

## 🚀 Özellikler

- ✅ Modern Next.js 14+ (App Router) ile geliştirilmiş
- ✅ TypeScript ile tip güvenliği
- ✅ Tailwind CSS ile responsive tasarım
- ✅ shadcn/ui component kütüphanesi
- ✅ Supabase entegrasyonu
- ✅ Landing page (Hero, Features, CTA)
- ✅ Yasal sayfalar (Privacy, Terms, Cookies, Third-party)

## 📁 Proje Yapısı

```
teamhubx-web/
├── app/                    # Next.js App Router
│   ├── legal/             # Yasal sayfalar
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global stiller
├── components/
│   ├── layout/            # Layout componentleri (Header, Footer)
│   └── sections/          # Landing page bölümleri (Hero, Features, CTA)
├── interfaces/            # TypeScript interface tanımları
├── lib/                   # Utility fonksiyonlar ve konfigürasyonlar
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Yardımcı fonksiyonlar
└── public/                # Statik dosyalar
```

## 🛠️ Kurulum

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. Environment değişkenlerini ayarlayın:

`.env.local` dosyası oluşturun ve Supabase/Jira test bilgilerinizi ekleyin (bkz. `docs/env.md`):

```env
NEXT_PUBLIC_APP_ENV=test
APP_ENV=test

NEXT_PUBLIC_SUPABASE_URL_TEST=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY_TEST=your_supabase_service_role_key

JIRA_CLIENT_ID_TEST=your_jira_dev_client_id
JIRA_CLIENT_SECRET_TEST=your_jira_dev_client_secret
NEXT_PUBLIC_APP_URL_TEST=http://localhost:3000
```

3. Development server'ı başlatın:

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📝 Scriptler

- `npm run dev` - Development server başlatır
- `npm run build` - Production build oluşturur
- `npm run start` - Production server başlatır
- `npm run lint` - ESLint ile kod kontrolü yapar

## 🎨 Teknoloji Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** Supabase
- **Deployment:** Vercel (önerilen)

## 📄 Sayfalar

- `/` - Ana sayfa (Landing page)
- `/legal/privacy` - Gizlilik Politikası
- `/legal/terms` - Kullanım Şartları
- `/legal/cookies` - Çerez Politikası
- `/legal/third-party` - Üçüncü Taraf Hizmetler

## 🔧 Geliştirme Kuralları

- Tüm interface'ler `interfaces/` klasöründe ayrı dosyalarda tanımlanmalı
- Component'ler `React.memo` ile optimize edilmeli
- `useMemo` ve `useCallback` ile performans optimizasyonu yapılmalı
- Inline style kullanılmamalı, Tailwind CSS kullanılmalı
- TypeScript strict mode aktif

## 📦 Deployment

### Vercel

1. GitHub repository'yi bağlayın
2. Environment variables ekleyin
3. Deploy edin

### Manuel Build

```bash
npm run build
npm run start
```

## 📞 İletişim

Sorularınız için iletişime geçebilirsiniz.

## 📄 Lisans

Tüm hakları saklıdır.
