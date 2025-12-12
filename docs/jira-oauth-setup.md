# Jira OAuth 2.0 (3LO) Kurulum Rehberi

## Sorun: "E-posta adresinin Jira uygulamasına erişimi yok"

Bu hata, OAuth uygulamasının Jira instance'ında yayınlanmamış veya kullanıcıya erişim verilmemiş olmasından kaynaklanır.

## Çözüm Adımları

### 1. Atlassian Developer Console'da OAuth Uygulamasını Kontrol Edin

1. https://developer.atlassian.com/console/myapps/ adresine gidin
2. OAuth uygulamanızı seçin (veya yeni bir tane oluşturun)

### 2. OAuth Uygulamasını Yayınlayın

**Önemli:** OAuth uygulaması "Published" olmalı veya Jira instance'ına yüklenmiş olmalı.

#### Seçenek A: Public Distribution (Önerilen - Production için)

1. Developer Console'da uygulamanızı açın
2. "Distribution" sekmesine gidin
3. "Publish" butonuna tıklayın
4. Uygulama artık herkes tarafından kullanılabilir

#### Seçenek B: Development Mode (Test için)

1. Uygulama "Development" modunda kalabilir
2. Ancak her kullanıcı ilk bağlantıda manuel onay vermeli
3. İlk bağlantıda kullanıcıya onay ekranı çıkar

### 3. Redirect URI'yi Doğrulayın

"Authorization" sekmesinde "Callback URL" şu olmalı:

**Local Development:**
```
http://localhost:3000/api/auth/jira/callback
```

**Production:**
```
https://teamhubx-web.vercel.app/api/auth/jira/callback
```

Veya custom domain kullanıyorsanız:
```
https://yourdomain.com/api/auth/jira/callback
```

### 4. Scope'ları Kontrol Edin

"Permissions" sekmesinde şu scope'lar olmalı:

- ✅ `read:jira-work` - Jira verilerini okuma
- ✅ `write:jira-work` - Jira verilerini güncelleme
- ✅ `offline_access` - Refresh token almak için
- ✅ `read:board-scope:jira-software` - **ÖNEMLİ:** Agile API (board'lar ve sprint'ler) için erişim

**Önemli:** `read:board-scope:jira-software` scope'u eklenmezse board'lar görüntülenemez ve hata alırsınız.

### 5. OAuth Uygulamasını Jira Instance'ına Yükleyin

#### Development Mode için:

1. Developer Console'da uygulamanızı açın
2. "Distribution" > "Request installation" 
3. Jira instance URL'ini girin: `https://pointf.atlassian.net`
4. "Request installation" butonuna tıklayın
5. Jira'da admin olarak giriş yapın ve onaylayın

#### Veya Jira'da Manuel Yükleme:

1. Jira'da: **Settings** > **Apps** > **Manage apps**
2. "Upload app" veya "Request app" seçeneğini kullanın
3. OAuth uygulamasının Client ID'sini girin

### 6. Environment Variables'ı Kontrol Edin

`.env.local` dosyanızda şunlar olmalı:

```bash
JIRA_CLIENT_ID_TEST=your_client_id_here
JIRA_CLIENT_SECRET_TEST=your_client_secret_here
NEXT_PUBLIC_APP_URL_TEST=http://localhost:3000
```

Production için:
```bash
JIRA_CLIENT_ID_PROD=your_client_id_here
JIRA_CLIENT_SECRET_PROD=your_client_secret_here
NEXT_PUBLIC_APP_URL_PROD=https://teamhubx-web.vercel.app
```

## Test Etme

1. Uygulamayı başlatın: `npm run dev`
2. Hesap sayfasına gidin: `/app/account`
3. "Connect Jira" butonuna tıklayın
4. Atlassian login sayfasına yönlendirilmelisiniz
5. Giriş yaptıktan sonra onay ekranı çıkmalı
6. Onayladıktan sonra callback'e yönlendirilmelisiniz

## Yaygın Hatalar

### "E-posta adresinin Jira uygulamasına erişimi yok"

**Çözüm:**
- OAuth uygulamasını "Published" yapın
- Veya OAuth uygulamasını Jira instance'ına yükleyin
- Veya kullanıcının Jira admin'i olmasını sağlayın (development mode için)

### "Invalid redirect URI"

**Çözüm:**
- Developer Console'da "Callback URL" ile kodunuzdaki `redirectUri` aynı olmalı
- Trailing slash olmamalı
- HTTP/HTTPS protokolü doğru olmalı

### "Invalid client"

**Çözüm:**
- `JIRA_CLIENT_ID` ve `JIRA_CLIENT_SECRET` doğru olmalı
- Environment variable'lar doğru yüklenmiş olmalı

## Daha Fazla Bilgi

- [Atlassian OAuth 2.0 Documentation](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)

