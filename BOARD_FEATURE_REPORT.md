# Board Özelliği - Gereksinim Analizi ve Veritabanı Raporu

## 1. Özellik Özeti

Kullanıcıların kendi kişisel board'larını oluşturabilmesi, bu board'larda task'larını, notlarını ve diğer içeriklerini organize edebilmesi için gerekli yapı.

## 2. Mevcut Durum Analizi

### Mevcut Tablolar:
- `rooms`: Takım odaları (geçici, oturum bazlı)
- `room_participants`: Oda katılımcıları
- `user_personal_tasks`: Kullanıcıya özel task'lar (board bağlantısı yok)
- `notes`: Kullanıcıya özel notlar (board bağlantısı yok)

### Eksiklikler:
- Task'lar ve notlar board'lara bağlı değil
- Board organizasyonu yok
- Board görselleştirme yok
- Board'lar arası içerik taşıma yok

## 3. Gereksinimler

### 3.1. Fonksiyonel Gereksinimler
1. **Board Oluşturma**: Kullanıcılar kendi board'larını oluşturabilmeli
2. **Board Yönetimi**: Board'ları düzenleyebilmeli, silebilmeli, arşivleyebilmeli
3. **İçerik Organizasyonu**: Task'lar ve notlar board'lara atanabilmeli
4. **Board Görselleştirme**: Board'lara renk, icon, açıklama eklenebilmeli
5. **Sıralama**: Board'ların sırası kullanıcı tarafından değiştirilebilmeli
6. **Board Paylaşımı** (opsiyonel): Board'lar paylaşılabilir olabilir

### 3.2. Teknik Gereksinimler
1. Board'lar kullanıcıya özel olmalı (user_key ile ilişkilendirilmeli)
2. Task'lar ve notlar board_id ile ilişkilendirilebilmeli
3. Board'lar soft delete ile silinmeli (is_deleted flag)
4. Board sıralaması için position alanı
5. Realtime subscription desteği

## 4. Veritabanı Şeması

### 4.1. Yeni Tablo: `user_boards`

Board'ları saklamak için ana tablo.

**Alanlar:**
- `id` (uuid, primary key)
- `user_key` (uuid, foreign key -> auth.users.id)
- `name` (text, not null) - Board adı
- `description` (text, nullable) - Board açıklaması
- `color` (text, nullable) - Board rengi (hex code)
- `icon` (text, nullable) - Board icon'u
- `position` (integer, default 0) - Sıralama için
- `is_archived` (boolean, default false) - Arşivlenmiş mi?
- `is_deleted` (boolean, default false) - Silinmiş mi? (soft delete)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**Indexler:**
- `user_key` üzerinde index (kullanıcı board'larını hızlı getirmek için)
- `user_key, is_deleted, is_archived` composite index (aktif board'ları getirmek için)
- `user_key, position` composite index (sıralama için)

### 4.2. Mevcut Tabloları Güncelleme

#### `user_personal_tasks` Tablosuna Eklenecek:
- `board_id` (uuid, nullable, foreign key -> user_boards.id)
- Index: `board_id` üzerinde

#### `notes` Tablosuna Eklenecek:
- `board_id` (uuid, nullable, foreign key -> user_boards.id)
- Index: `board_id` üzerinde

**Not:** Mevcut task'lar ve notlar `board_id = null` olacak (varsayılan "Unorganized" board gibi davranılabilir)

## 5. SQL Kodları

### 5.1. `user_boards` Tablosu Oluşturma

```sql
-- user_boards tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.user_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_key UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT, -- Hex color code (örn: #FF5733)
    icon TEXT, -- Icon name veya emoji
    position INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: Board adı boş olamaz
    CONSTRAINT board_name_not_empty CHECK (char_length(trim(name)) > 0),
    
    -- Constraint: Position negatif olamaz
    CONSTRAINT board_position_non_negative CHECK (position >= 0)
);

-- Indexler
CREATE INDEX idx_user_boards_user_key ON public.user_boards(user_key);
CREATE INDEX idx_user_boards_user_active ON public.user_boards(user_key, is_deleted, is_archived) WHERE is_deleted = false AND is_archived = false;
CREATE INDEX idx_user_boards_position ON public.user_boards(user_key, position);

-- updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_user_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_boards_updated_at
    BEFORE UPDATE ON public.user_boards
    FOR EACH ROW
    EXECUTE FUNCTION update_user_boards_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_boards ENABLE ROW LEVEL SECURITY;

-- Policy: Kullanıcılar sadece kendi board'larını görebilir
CREATE POLICY "Users can view their own boards"
    ON public.user_boards
    FOR SELECT
    USING (auth.uid() = user_key);

-- Policy: Kullanıcılar sadece kendi board'larını oluşturabilir
CREATE POLICY "Users can insert their own boards"
    ON public.user_boards
    FOR INSERT
    WITH CHECK (auth.uid() = user_key);

-- Policy: Kullanıcılar sadece kendi board'larını güncelleyebilir
CREATE POLICY "Users can update their own boards"
    ON public.user_boards
    FOR UPDATE
    USING (auth.uid() = user_key)
    WITH CHECK (auth.uid() = user_key);

-- Policy: Kullanıcılar sadece kendi board'larını silebilir
CREATE POLICY "Users can delete their own boards"
    ON public.user_boards
    FOR DELETE
    USING (auth.uid() = user_key);
```

### 5.2. `user_personal_tasks` Tablosunu Güncelleme

```sql
-- user_personal_tasks tablosuna board_id ekle
ALTER TABLE public.user_personal_tasks
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.user_boards(id) ON DELETE SET NULL;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_user_personal_tasks_board_id ON public.user_personal_tasks(board_id);

-- RLS Policy güncelleme (eğer varsa)
-- Kullanıcılar sadece kendi task'larını görebilir ve board'larına atayabilir
-- Mevcut policy'ler zaten user_key kontrolü yapıyorsa, ek bir şey gerekmez
```

### 5.3. `notes` Tablosunu Güncelleme

```sql
-- notes tablosuna board_id ekle
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.user_boards(id) ON DELETE SET NULL;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_notes_board_id ON public.notes(board_id);

-- RLS Policy güncelleme (eğer varsa)
-- Kullanıcılar sadece kendi notlarını görebilir ve board'larına atayabilir
-- Mevcut policy'ler zaten user_key kontrolü yapıyorsa, ek bir şey gerekmez
```

## 6. Frontend Geliştirme Planı

### 6.1. Yeni Interface'ler

**`interfaces/Board.interface.ts`** oluşturulmalı:
```typescript
export interface Board {
  id: string;
  user_key: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  position: number;
  is_archived: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  position?: number;
}
```

### 6.2. Yeni Hook'lar

**`hooks/useBoards.ts`** oluşturulmalı:
- Board'ları listeleme
- Board oluşturma
- Board güncelleme
- Board silme (soft delete)
- Board arşivleme
- Board sıralama güncelleme
- Realtime subscription

### 6.3. Yeni Component'ler

1. **`components/boards/BoardList.tsx`**: Board listesi görünümü
2. **`components/boards/BoardCard.tsx`**: Tek bir board kartı
3. **`components/boards/CreateBoardModal.tsx`**: Board oluşturma modal'ı
4. **`components/boards/EditBoardModal.tsx`**: Board düzenleme modal'ı
5. **`components/boards/BoardView.tsx`**: Board detay görünümü (task'lar ve notlar)

### 6.4. Yeni Sayfalar

1. **`app/app/boards/page.tsx`**: Board listesi sayfası
2. **`app/app/boards/[id]/page.tsx`**: Board detay sayfası

### 6.5. Mevcut Component'lerin Güncellenmesi

1. **`components/tasks/PersonalTaskList.tsx`**: Board filtresi eklenmeli
2. **`components/notes/NoteList.tsx`**: Board filtresi eklenmeli
3. **`components/tasks/PersonalTaskForm.tsx`**: Board seçimi eklenmeli
4. **`components/notes/NoteModal.tsx`**: Board seçimi eklenmeli

## 7. Özellik Öncelikleri

### Faz 1 (MVP):
- ✅ Board oluşturma
- ✅ Board listeleme
- ✅ Board düzenleme
- ✅ Board silme (soft delete)
- ✅ Task'lara board atama
- ✅ Notlara board atama

### Faz 2 (Gelişmiş Özellikler):
- Board arşivleme
- Board sıralama (drag & drop)
- Board renk ve icon seçimi
- Board istatistikleri (kaç task, kaç not)
- Board arama ve filtreleme

### Faz 3 (Opsiyonel):
- Board paylaşımı
- Board şablonları
- Board dışa aktarma

## 8. Güvenlik Notları

1. **RLS Policies**: Tüm board işlemleri için Row Level Security aktif olmalı
2. **Foreign Key Constraints**: Board silindiğinde task'lar ve notlar `board_id = null` olmalı (ON DELETE SET NULL)
3. **Validation**: Board adı boş olamaz, position negatif olamaz
4. **Soft Delete**: Board'lar fiziksel olarak silinmemeli, `is_deleted = true` yapılmalı

## 9. Performans Notları

1. **Indexler**: `user_key`, `board_id`, `position` üzerinde indexler kritik
2. **Realtime**: Board değişiklikleri için Supabase Realtime kullanılmalı
3. **Pagination**: Çok sayıda board varsa pagination düşünülmeli
4. **Caching**: Board listesi client-side cache'lenebilir

## 10. Test Senaryoları

1. Board oluşturma testi
2. Board silme testi (soft delete)
3. Task'ı board'a atama testi
4. Notu board'a atama testi
5. Board'ı silince task'ların `board_id = null` olması testi
6. RLS policy testleri (başka kullanıcının board'ına erişim engelleme)

## 11. Migration Stratejisi

1. Önce `user_boards` tablosu oluşturulmalı
2. Sonra `user_personal_tasks` ve `notes` tablolarına `board_id` eklenmeli
3. Mevcut veriler için varsayılan bir "Unorganized" board oluşturulabilir (opsiyonel)
4. Frontend geliştirmeleri yapılmalı

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2024  
**Versiyon:** 1.0

