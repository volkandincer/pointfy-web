# Jira OAuth Callback URL Dinamik Yönetimi - Analiz ve Çözüm

## Problem

Jira OAuth callback URL'leri için:
- **Local'de:** `http://localhost:3000/api/auth/jira/callback` çalışmalı
- **Production'da:** `https://teamhubx-web.vercel.app/api/auth/jira/callback` çalışmalı
- **Atlassian Developer Console'da:** Her iki URL de tanımlı olmalı

Mevcut sistem env variable'lara bağımlıydı ve her environment için ayrı değer set etmek gerekiyordu.

## Çözüm: Request'ten Dinamik URL Alma

### Yaklaşım

Request'ten otomatik olarak URL'i almak, env variable'ları fallback olarak kullanmak.

### Avantajlar

1. ✅ **Otomatik Detection:** Request'ten URL otomatik alınır
2. ✅ **Vercel Uyumlu:** Vercel'de otomatik olarak doğru URL kullanılır
3. ✅ **Local Uyumlu:** Local'de `localhost:3000` otomatik kullanılır
4. ✅ **Custom Domain Desteği:** Custom domain'ler otomatik çalışır
5. ✅ **Güvenlik:** Whitelist kontrolü ile güvenli
6. ✅ **Fallback:** Env variable'lar fallback olarak kalır

### Nasıl Çalışıyor?

1. **Request'ten URL Alma:**
   ```typescript
   const url = new URL(request.url);
   const origin = url.origin; // http://localhost:3000 veya https://teamhubx-web.vercel.app
   ```

2. **Öncelik Sırası:**
   - Request'ten gelen origin (whitelist kontrolü ile)
   - `VERCEL_URL` (Vercel'de otomatik)
   - Env variable (`NEXT_PUBLIC_APP_URL`)
   - Fallback (environment'a göre)

3. **Güvenlik:**
   - Whitelist kontrolü ile sadece izin verilen domain'ler kullanılır
   - Development modunda kontrol gevşetilir

## Kullanım

### Kod Değişiklikleri

**Önceki Kullanım:**
```typescript
const { appUrl } = jiraConfig;
const redirectUri = `${appUrl}/api/auth/jira/callback`;
```

**Yeni Kullanım:**
```typescript
const { getAppUrl } = jiraConfig;
const appUrl = getAppUrl(request);
const redirectUri = `${appUrl}/api/auth/jira/callback`;
```

### Atlassian Developer Console Ayarları

Atlassian Developer Console'da **her iki callback URL'i de** tanımlamanız gerekiyor:

1. **Authorization** sekmesine gidin
2. **Callback URL** alanına şunları ekleyin:
   ```
   http://localhost:3000/api/auth/jira/callback
   https://teamhubx-web.vercel.app/api/auth/jira/callback
   ```
   (veya custom domain kullanıyorsanız onu da ekleyin)

3. Her URL'i ayrı satırda ekleyin veya virgülle ayırın (Atlassian'ın formatına göre)

## Environment Variables

Artık **zorunlu değil** ama **fallback olarak kullanılabilir**:

### Opsiyonel (Fallback için)

```bash
# Local (.env.local)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production (Vercel)
NEXT_PUBLIC_APP_URL=https://teamhubx-web.vercel.app
```

### Vercel Otomatik Değişkenler

Vercel otomatik olarak şu değişkenleri sağlar:
- `VERCEL_URL`: Deployment URL'i (örn: `teamhubx-web-abc123.vercel.app`)
- `VERCEL_ENV`: Environment (`production`, `preview`, `development`)

Bu değişkenler otomatik kullanılır, manuel set etmenize gerek yok.

## Güvenlik Notları

1. **Whitelist Kontrolü:**
   - Production'da sadece whitelist'teki domain'ler kullanılır
   - Development modunda kontrol gevşetilir
   - Yeni domain eklemek için `lib/jiraConfig.ts` dosyasındaki `allowedHosts` array'ini güncelleyin

2. **OAuth Redirect URI Matching:**
   - Atlassian OAuth, redirect URI'lerin **tam olarak eşleşmesini** gerektirir
   - Bu yüzden Atlassian Developer Console'da tüm olası URL'leri tanımlamanız gerekir

## Test Senaryoları

### Local Development
```bash
# .env.local (opsiyonel)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Çalışır: http://localhost:3000/api/auth/jira/callback
```

### Vercel Production
```bash
# Vercel Environment Variables (opsiyonel)
NEXT_PUBLIC_APP_URL=https://teamhubx-web.vercel.app

# Çalışır: https://teamhubx-web.vercel.app/api/auth/jira/callback
```

### Vercel Preview
```bash
# Otomatik: VERCEL_URL kullanılır
# Çalışır: https://teamhubx-web-abc123.vercel.app/api/auth/jira/callback
```

### Custom Domain
```bash
# Vercel Environment Variables
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Çalışır: https://yourdomain.com/api/auth/jira/callback
# Not: Custom domain'i allowedHosts'a eklemeniz gerekebilir
```

## Sonuç

✅ **Env variable'lara bağımlılık azaldı**
✅ **Otomatik URL detection çalışıyor**
✅ **Local ve production'da sorunsuz çalışıyor**
✅ **Vercel preview deployment'ları destekleniyor**
✅ **Güvenlik kontrolü mevcut**

## Gelecek İyileştirmeler

1. **Dynamic Whitelist:** Database'den whitelist yönetimi
2. **Domain Validation:** Daha gelişmiş domain doğrulama
3. **Logging:** Callback URL kullanımını loglama
4. **Monitoring:** OAuth callback başarı/başarısızlık oranlarını izleme

