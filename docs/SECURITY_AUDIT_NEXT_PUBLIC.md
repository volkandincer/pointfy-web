# Security Audit: NEXT_PUBLIC_ Environment Variables

## Genel Bakış

`NEXT_PUBLIC_` prefix'li tüm environment variable'lar Next.js tarafından client-side bundle'a dahil edilir ve tarayıcıda inspect ile görülebilir. Bu audit, hangi değişkenlerin güvenli olduğunu ve hangilerine dikkat edilmesi gerektiğini belirler.

## Kullanılan NEXT_PUBLIC_ Değişkenleri

### 1. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY

**Durum:** ✅ Güvenli (Public olması gereken değerler)

**Kullanım Yerleri:**
- `lib/supabase.ts` - Supabase client oluşturma
- `lib/appEnvironment.ts` - Environment resolution
- API route'larında (server-side)

**Açıklama:**
- Supabase anon key zaten public olması gereken bir key'dir
- Row Level Security (RLS) policies ile korunur
- Bu key ile sadece RLS policy'lerinin izin verdiği işlemler yapılabilir
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) kesinlikle `NEXT_PUBLIC_` prefix'i olmadan kullanılıyor ✅

**Öneri:** Mevcut kullanım güvenli, değişiklik gerekmez.

---

### 2. NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL

**Durum:** ✅ Güvenli (Public bilgi)

**Kullanım Yerleri:**
- `components/rooms/ShareRoomButton.tsx` - Client component'te share URL oluşturma
- `app/sitemap.ts` - Sitemap generation (server-side)
- `app/robots.ts` - Robots.txt generation (server-side)
- `lib/jiraConfig.ts` - Jira OAuth redirect URL (server-side)

**Açıklama:**
- Site URL'i zaten public bilgidir
- OAuth redirect URL'leri de public olması gereken değerlerdir
- Bu bilgilerin expose edilmesi güvenlik riski oluşturmaz

**Öneri:** Mevcut kullanım güvenli, değişiklik gerekmez.

---

### 3. NEXT_PUBLIC_APP_ENV / NEXT_PUBLIC_JIRA_ENVIRONMENT

**Durum:** ✅ Güvenli (Environment indicator)

**Kullanım Yerleri:**
- `lib/appEnvironment.ts` - Environment detection
- Test/prod ayrımı için kullanılıyor

**Açıklama:**
- Sadece environment bilgisini gösterir (`test` veya `prod`)
- Hassas bilgi içermez

**Öneri:** Mevcut kullanım güvenli, değişiklik gerekmez.

---

## Client-Side Bundle'a Dahil Olan Kodlar

### lib/appEnvironment.ts

**Durum:** ⚠️ Dikkat Gerekli

**Sorun:**
- `publicEnvStore` objesi tüm `NEXT_PUBLIC_*` değişkenlerini içeriyor
- Bu obje client-side bundle'a dahil oluyor
- Ancak bu Next.js'in beklenen davranışıdır (`NEXT_PUBLIC_` prefix'i zaten bunun için var)

**Mevcut Durum:**
```typescript
const publicEnvStore: Record<string, string | undefined> = {
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // ... diğer NEXT_PUBLIC_ değişkenleri
};
```

**Değerlendirme:**
- Bu değişkenler zaten public olması gereken değerler
- Supabase anon key public key'dir (RLS ile korunur)
- Site URL'leri public bilgidir
- Environment bilgisi hassas değildir

**Öneri:** Mevcut implementasyon güvenli. Ancak gelecekte hassas bilgi eklenmemeli.

---

## Server-Side Only Değişkenler

Aşağıdaki değişkenler **kesinlikle** `NEXT_PUBLIC_` prefix'i olmadan kullanılıyor ✅:

- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (RLS bypass)
- `JIRA_CLIENT_SECRET` - Jira OAuth client secret
- `JIRA_CLIENT_ID` - Jira OAuth client ID (bu public olabilir ama secret değil)

**Kontrol:** ✅ Tüm hassas credentials server-side only olarak kullanılıyor.

---

## Source Maps

**Durum:** ✅ Düzeltildi

**Değişiklik:**
- `next.config.ts`'e `productionBrowserSourceMaps: false` eklendi
- Production build'lerde source map'ler artık generate edilmeyecek
- Bu sayede orijinal kaynak kodu expose edilmeyecek

---

## Öneriler ve Best Practices

### ✅ Yapılması Gerekenler

1. **Mevcut NEXT_PUBLIC_ kullanımları güvenli** - Değişiklik gerekmez
2. **Source map'ler disable edildi** - Production'da source code expose edilmeyecek
3. **Hassas credentials server-side only** - Service role key ve secrets doğru kullanılıyor

### ⚠️ Dikkat Edilmesi Gerekenler

1. **Gelecekte yeni NEXT_PUBLIC_ değişkeni eklerken:**
   - Sadece gerçekten public olması gereken değerler için kullanılmalı
   - API keys, secrets, tokens gibi hassas bilgiler **asla** `NEXT_PUBLIC_` prefix'i ile kullanılmamalı

2. **Client-side component'lerde:**
   - `resolveEnvValue()` fonksiyonu kullanılırken, sadece public değerler için kullanılmalı
   - Server-side only değerler client component'lerde kullanılmamalı

3. **Code review checklist:**
   - [ ] Yeni `NEXT_PUBLIC_*` değişkeni ekleniyor mu?
   - [ ] Bu değişken gerçekten public olması gereken bir değer mi?
   - [ ] Hassas bilgi (API key, secret, token) içeriyor mu?
   - [ ] Client-side bundle'a dahil olması güvenli mi?

---

## Sonuç

Mevcut `NEXT_PUBLIC_*` kullanımları güvenli ve doğru şekilde implemente edilmiş. Supabase anon key ve site URL'leri gibi public olması gereken değerler client-side'da kullanılıyor, bu normal ve güvenli. Hassas credentials (service role key, OAuth secrets) server-side only olarak kullanılıyor.

**Risk Seviyesi:** ✅ Düşük

**Aksiyon Gerekli:** Hayır (mevcut durum güvenli)

**Son Güncelleme:** 2024 (Security Audit)
