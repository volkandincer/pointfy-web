# Jira Issue Create Özelliği Test Rehberi

## 📋 Önkoşullar

1. **Jira Bağlantısı Kontrolü:**
   - `/app/jira/settings` sayfasına gidin
   - Jira hesabınızın bağlı olduğundan emin olun
   - Eğer bağlı değilse "Jira'yı Bağla" butonuna tıklayın

2. **Personal Task Oluşturma:**
   - `/app/tasks` sayfasına gidin
   - En az bir personal task oluşturun (test için)

## 🧪 Test Adımları

### Adım 1: Personal Tasks Sayfasına Gidin
```
http://localhost:3000/app/tasks
```

### Adım 2: Bir Task Kartını Bulun
- Task kartlarında "Jira'da Aç" butonunu görmelisiniz
- Buton mor renkte ve kartın üst kısmında olmalı

### Adım 3: "Jira'da Aç" Butonuna Tıklayın
- Modal açılmalı
- Modal başlığı: "Jira'da Task Aç"
- Modal içeriği:
  - Proje dropdown'ı (yükleniyor... gösterir)
  - Issue Type dropdown'ı (proje seçilene kadar disabled)
  - Summary input (task title'dan otomatik doldurulmuş)
  - Description textarea (task description'dan otomatik doldurulmuş)

### Adım 4: Proje Seçin
- Proje dropdown'ından bir proje seçin
- Issue Type dropdown'ı aktif olmalı ve yüklenmeye başlamalı
- Issue type'lar yüklendikten sonra dropdown'da görünmeli

### Adım 5: Issue Type Seçin
- Issue Type dropdown'ından bir tip seçin (örn: Task, Bug, Story)
- İlk issue type otomatik seçilmiş olmalı

### Adım 6: Formu Kontrol Edin
- Summary: Personal task'ın title'ı otomatik doldurulmuş olmalı
- Description: Personal task'ın description'ı otomatik doldurulmuş olmalı (varsa)
- Her iki alan da düzenlenebilir olmalı

### Adım 7: "Jira'da Aç" Butonuna Tıklayın
- Buton "Oluşturuluyor..." durumuna geçmeli
- Loading state gösterilmeli
- Başarılı olursa:
  - Toast mesajı: "Jira issue başarıyla oluşturuldu: [ISSUE-KEY]"
  - Modal kapanmalı
  - Jira'da issue oluşturulmuş olmalı

## 🔍 Kontrol Edilecekler

### ✅ Başarılı Senaryo
1. Modal açılıyor
2. Projeler yükleniyor
3. Proje seçildiğinde issue type'lar yükleniyor
4. Form otomatik dolduruluyor
5. Issue başarıyla oluşturuluyor
6. Toast mesajı gösteriliyor

### ❌ Hata Senaryoları

#### Senaryo 1: Jira Bağlantısı Yok
- **Beklenen:** "Jira bağlantısı gerekli" hatası
- **Çözüm:** Jira Settings'ten Jira'yı bağlayın

#### Senaryo 2: Proje Yüklenemiyor
- **Beklenen:** "Projeler yüklenemedi" hatası
- **Kontrol:** Jira token'ının geçerli olduğundan emin olun

#### Senaryo 3: Issue Type Yüklenemiyor
- **Beklenen:** "Issue type'ları yüklenemedi" hatası
- **Kontrol:** Seçilen projenin geçerli olduğundan emin olun

#### Senaryo 4: Issue Oluşturulamıyor
- **Beklenen:** "Issue oluşturulamadı" hatası
- **Kontrol:** 
  - Jira token'ının `write:jira-work` scope'una sahip olduğundan emin olun
  - Proje ve issue type'ın geçerli olduğundan emin olun
  - Summary alanının doldurulduğundan emin olun

## 🐛 Debug İpuçları

### Browser Console Kontrolü
1. F12 ile Developer Tools'u açın
2. Console sekmesine gidin
3. Hata mesajlarını kontrol edin

### Network Tab Kontrolü
1. Network sekmesine gidin
2. "Jira'da Aç" butonuna tıklayın
3. Şu API çağrılarını kontrol edin:
   - `/api/jira/boards` - Projeleri getirir
   - `/api/jira/projects/[projectKey]/issue-types` - Issue type'ları getirir
   - `/api/jira/issues/create` - Issue oluşturur

### API Response Kontrolü
- Her API çağrısının response'unu kontrol edin
- Hata durumunda error mesajını okuyun
- Status code'ları kontrol edin (200 = başarılı, 400/401/500 = hata)

## 📝 Test Checklist

- [ ] Personal Tasks sayfası açılıyor
- [ ] Task kartlarında "Jira'da Aç" butonu görünüyor
- [ ] Butona tıklayınca modal açılıyor
- [ ] Projeler yükleniyor
- [ ] Proje seçildiğinde issue type'lar yükleniyor
- [ ] Summary ve description otomatik dolduruluyor
- [ ] Form alanları düzenlenebiliyor
- [ ] "Jira'da Aç" butonu çalışıyor
- [ ] Issue başarıyla oluşturuluyor
- [ ] Toast mesajı gösteriliyor
- [ ] Modal kapanıyor
- [ ] Jira'da issue görünüyor

## 🎯 Sonuç

Test başarılıysa:
- Personal task'larınızdan Jira'ya issue açabilirsiniz
- Form otomatik doldurulur
- Hata durumlarında kullanıcı dostu mesajlar gösterilir

Test başarısızsa:
- Browser console'u kontrol edin
- Network tab'ı kontrol edin
- Jira bağlantısını kontrol edin
- API response'larını kontrol edin

