-- =====================================================
-- Board Özelliği - Veritabanı Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır
-- Sırayla çalıştırılması önerilir

-- =====================================================
-- 1. user_boards Tablosu Oluşturma
-- =====================================================

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

-- =====================================================
-- 2. Indexler
-- =====================================================

CREATE INDEX idx_user_boards_user_key ON public.user_boards(user_key);
CREATE INDEX idx_user_boards_user_active ON public.user_boards(user_key, is_deleted, is_archived) 
    WHERE is_deleted = false AND is_archived = false;
CREATE INDEX idx_user_boards_position ON public.user_boards(user_key, position);

-- =====================================================
-- 3. updated_at Otomatik Güncelleme Trigger'ı
-- =====================================================

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

-- =====================================================
-- 4. Row Level Security (RLS) Policies
-- =====================================================

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

-- =====================================================
-- 5. user_personal_tasks Tablosunu Güncelleme
-- =====================================================

-- board_id kolonunu ekle
ALTER TABLE public.user_personal_tasks
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.user_boards(id) ON DELETE SET NULL;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_user_personal_tasks_board_id ON public.user_personal_tasks(board_id);

-- =====================================================
-- 6. notes Tablosunu Güncelleme
-- =====================================================

-- board_id kolonunu ekle
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.user_boards(id) ON DELETE SET NULL;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_notes_board_id ON public.notes(board_id);

-- =====================================================
-- 7. Realtime Subscription İçin Publication (Opsiyonel)
-- =====================================================
-- Supabase Realtime için publication zaten aktifse ek bir şey gerekmez
-- Eğer değilse, Supabase Dashboard'dan Realtime'ı aktifleştirin

-- =====================================================
-- Migration Tamamlandı
-- =====================================================
-- Not: Mevcut task'lar ve notlar board_id = null olacak
-- İsterseniz kullanıcılar için varsayılan bir "Unorganized" board oluşturabilirsiniz

