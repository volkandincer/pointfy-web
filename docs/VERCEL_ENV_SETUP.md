# Vercel Environment Variables Setup Guide

Bu doküman, Vercel'e eklenmesi gereken environment variable'ları ve local `.env.local` dosyası için güncellemeleri içerir.

## 📋 Vercel'e Eklenecek Environment Variables (Production)

Vercel Dashboard → Projeniz → Settings → Environment Variables → **Production** environment seçili olmalı.

### Zorunlu Değişkenler

| Variable                             | Değer                                                                                                                                                                                                                         | Açıklama                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_APP_ENV`                | `prod`                                                                                                                                                                                                                        | Production environment'ı aktif eder        |
| `NEXT_PUBLIC_SUPABASE_URL_PROD`      | `https://lrlltctmxrtjkfpytizz.supabase.co`                                                                                                                                                                                    | Supabase project URL (Production)          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDEwMzUsImV4cCI6MjA2OTQ3NzAzNX0.Ql7mvjObHprB15JeQ-9ZQ6Z3FFpVBUzUxpSuys4m_0I`            | Supabase anon public key (Production)      |
| `SUPABASE_SERVICE_ROLE_KEY_PROD`     | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMTAzNSwiZXhwIjoyMDY5NDc3MDM1fQ.n6YBv8AH2YeRiTGQ0bfPLvXyZBfHuWz5-k5rDYGw4uI` | Supabase service role key (Production)     |
| `JIRA_CLIENT_ID_PROD`                | `sr2AffUsK3F8rDRuKYhfUV41l642nAyS`                                                                                                                                                                                            | Atlassian OAuth client ID (Production)     |
| `JIRA_CLIENT_SECRET_PROD`            | `<your-jira-client-secret-prod>`                                                                                                                                                                                              | Atlassian OAuth client secret (Production) |
| `NEXT_PUBLIC_SITE_URL_PROD`          | `https://teamhubx.vercel.app`                                                                                                                                                                                                 | Site URL (robots.txt ve sitemap için)      |

### Opsiyonel Değişkenler (Fallback için)

| Variable                   | Değer                         | Açıklama                                             |
| -------------------------- | ----------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL_PROD` | `https://teamhubx.vercel.app` | App URL (artık zorunlu değil, dinamik detection var) |
| `JIRA_BASE_URL_PROD`       | `teamhubx.atlassian.net`      | Jira base URL (fallback için)                        |

---

## 📝 Local `.env.local` Dosyası Güncellemesi

Proje root dizinindeki `.env.local` dosyanızı aşağıdaki gibi güncelleyin:

```bash
# ============================================
# Environment Control
# ============================================
NEXT_PUBLIC_APP_ENV=test
APP_ENV=test
NEXT_PUBLIC_JIRA_ENVIRONMENT=test

# ============================================
# Supabase (Test/Local)
# ============================================
NEXT_PUBLIC_SUPABASE_URL_TEST=https://lrlltctmxrtjkfpytizz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDEwMzUsImV4cCI6MjA2OTQ3NzAzNX0.Ql7mvjObHprB15JeQ-9ZQ6Z3FFpVBUzUxpSuys4m_0I
SUPABASE_SERVICE_ROLE_KEY_TEST=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMTAzNSwiZXhwIjoyMDY5NDc3MDM1fQ.n6YBv8AH2YeRiTGQ0bfPLvXyZBfHuWz5-k5rDYGw4uI

# ============================================
# Supabase (Production - Fallback)
# ============================================
NEXT_PUBLIC_SUPABASE_URL_PROD=https://lrlltctmxrtjkfpytizz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDEwMzUsImV4cCI6MjA2OTQ3NzAzNX0.Ql7mvjObHprB15JeQ-9ZQ6Z3FFpVBUzUxpSuys4m_0I
SUPABASE_SERVICE_ROLE_KEY_PROD=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMTAzNSwiZXhwIjoyMDY5NDc3MDM1fQ.n6YBv8AH2YeRiTGQ0bfPLvXyZBfHuWz5-k5rDYGw4uI

# ============================================
# Jira OAuth (Test/Local)
# ============================================
JIRA_CLIENT_ID_TEST=bZfkocaaMQb1ZClMR8xtBxe7XDb8MizO
JIRA_CLIENT_SECRET_TEST=ATOAf-aV76npr6qbwV7mZjExXhvKb-hWjxc3HAXQ8XuptiQOGf2UtqqakSeVsAspi4Z877DE8A7C
NEXT_PUBLIC_APP_URL_TEST=http://localhost:3000

# ============================================
# Jira OAuth (Production)
# ============================================
JIRA_CLIENT_ID_PROD=sr2AffUsK3F8rDRuKYhfUV41l642nAyS
JIRA_CLIENT_SECRET_PROD=ATOAZncXgo-IMT6BV8wYWy7orxGuDAHRe262696fGh4p16QjXBxvVzDgRk7GI-f-9VojB46D242D
NEXT_PUBLIC_APP_URL_PROD=https://teamhubx.vercel.app

# ============================================
# Jira Base URL (Opsiyonel - Fallback)
# ============================================
JIRA_BASE_URL=teamhubx.atlassian.net

# ============================================
# Site URL
# ============================================
NEXT_PUBLIC_SITE_URL_TEST=http://localhost:3000
NEXT_PUBLIC_SITE_URL_PROD=https://teamhubx.vercel.app

# ============================================
# Bitbucket (Opsiyonel - Eğer kullanıyorsanız)
# ============================================
BITBUCKET_CLIENT_ID=8LXKShCYsDEWDdFSsv
BITBUCKET_CLIENT_SECRET=4kd2eFvHpxDd8JR2VCHsNkqACYXbuwaw
```

---

## 🔄 Alternatif: Suffix'siz Kullanım (Tek Set)

Eğer test ve production için aynı değerleri kullanmak istiyorsanız, suffix'siz versiyonları da kullanabilirsiniz:

### Vercel (Production)

```bash
NEXT_PUBLIC_APP_ENV=prod
NEXT_PUBLIC_SUPABASE_URL=https://lrlltctmxrtjkfpytizz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDEwMzUsImV4cCI6MjA2OTQ3NzAzNX0.Ql7mvjObHprB15JeQ-9ZQ6Z3FFpVBUzUxpSuys4m_0I
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMTAzNSwiZXhwIjoyMDY5NDc3MDM1fQ.n6YBv8AH2YeRiTGQ0bfPLvXyZBfHuWz5-k5rDYGw4uI
JIRA_CLIENT_ID=sr2AffUsK3F8rDRuKYhfUV41l642nAyS
JIRA_CLIENT_SECRET=ATOAZncXgo-IMT6BV8wYWy7orxGuDAHRe262696fGh4p16QjXBxvVzDgRk7GI-f-9VojB46D242D
NEXT_PUBLIC_SITE_URL=https://teamhubx.vercel.app
```

### Local `.env.local` (Suffix'siz)

```bash
NEXT_PUBLIC_APP_ENV=test
NEXT_PUBLIC_SUPABASE_URL=https://lrlltctmxrtjkfpytizz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDEwMzUsImV4cCI6MjA2OTQ3NzAzNX0.Ql7mvjObHprB15JeQ-9ZQ6Z3FFpVBUzUxpSuys4m_0I
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybGx0Y3RteHJ0amtmcHl0aXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwMTAzNSwiZXhwIjoyMDY5NDc3MDM1fQ.n6YBv8AH2YeRiTGQ0bfPLvXyZBfHuWz5-k5rDYGw4uI
JIRA_CLIENT_ID=bZfkocaaMQb1ZClMR8xtBxe7XDb8MizO
JIRA_CLIENT_SECRET=ATOAf-aV76npr6qbwV7mZjExXhvKb-hWjxc3HAXQ8XuptiQOGf2UtqqakSeVsAspi4Z877DE8A7C
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 📌 Önemli Notlar

### 1. Vercel Otomatik Değişkenler

Vercel otomatik olarak şu değişkenleri sağlar (manuel set etmeyin):

- `VERCEL_URL` - Deployment URL'i (dinamik URL detection için kullanılır)
- `VERCEL_ENV` - Environment (`production`, `preview`, `development`)

### 2. Callback URL'ler

Atlassian Developer Console'da şu callback URL'leri tanımlı olmalı:

- `http://localhost:3000/api/auth/jira/callback` (Local)
- `https://teamhubx.vercel.app/api/auth/jira/callback` (Production)

### 3. Environment Detection

Sistem şu sırayla environment'ı tespit eder:

1. `NEXT_PUBLIC_APP_ENV` veya `APP_ENV`
2. `NEXT_PUBLIC_JIRA_ENVIRONMENT` veya `JIRA_ENV`
3. `VERCEL_ENV` (Vercel'de otomatik)
4. Fallback: `test`

### 4. URL Detection

Callback URL'ler artık dinamik olarak request'ten alınır:

- Local'de: `http://localhost:3000` otomatik
- Production'da: Vercel URL'i otomatik
- `NEXT_PUBLIC_APP_URL` artık zorunlu değil (fallback olarak kullanılabilir)

---

## ✅ Kontrol Listesi

### Vercel Setup

- [ ] `NEXT_PUBLIC_APP_ENV=prod` eklendi
- [ ] Supabase değişkenleri eklendi (`_PROD` suffix'li)
- [ ] Jira OAuth değişkenleri eklendi (`_PROD` suffix'li)
- [ ] `NEXT_PUBLIC_SITE_URL_PROD` eklendi
- [ ] Environment: **Production** seçili

### Local Setup

- [ ] `.env.local` dosyası güncellendi
- [ ] Test değişkenleri eklendi (`_TEST` suffix'li veya suffix'siz)
- [ ] `NEXT_PUBLIC_APP_ENV=test` set edildi

### Atlassian Developer Console

- [ ] Local callback URL tanımlı: `http://localhost:3000/api/auth/jira/callback`
- [ ] Production callback URL tanımlı: `https://teamhubx.vercel.app/api/auth/jira/callback`

---

## 🚀 Sonraki Adımlar

1. Vercel'e environment variable'ları ekleyin
2. `.env.local` dosyanızı güncelleyin
3. Local'de test edin: `npm run dev`
4. Vercel'de yeni bir deployment tetikleyin
5. Production'da test edin
