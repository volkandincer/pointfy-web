-- =====================================================
-- Retro Action Items - Flag Sistemi Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır
-- Aksiyon maddelerine flag (etiket) ekleme özelliği için

-- =====================================================
-- 1. retro_action_items Tablosuna Flag Alanı Ekleme
-- =====================================================

-- Flag alanı ekle (önceden tanımlı flag'ler için)
ALTER TABLE public.retro_action_items
ADD COLUMN IF NOT EXISTS flag TEXT;

-- Custom flag alanı ekle (kullanıcı tanımlı flag'ler için)
ALTER TABLE public.retro_action_items
ADD COLUMN IF NOT EXISTS custom_flag TEXT;

-- Index ekle (flag'e göre filtreleme için)
CREATE INDEX IF NOT EXISTS idx_retro_action_items_flag 
ON public.retro_action_items(room_id, flag);

CREATE INDEX IF NOT EXISTS idx_retro_action_items_custom_flag 
ON public.retro_action_items(room_id, custom_flag);

-- =====================================================
-- 2. Room Custom Flags Tablosu Oluşturma
-- =====================================================
-- Her oda için özel flag'leri saklamak için

CREATE TABLE IF NOT EXISTS public.room_custom_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    flag_name TEXT NOT NULL,
    flag_color TEXT DEFAULT '#6B7280', -- Varsayılan gri renk
    created_by_key UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: Flag adı boş olamaz
    CONSTRAINT room_custom_flag_name_not_empty CHECK (char_length(trim(flag_name)) > 0),
    
    -- Constraint: Aynı oda için aynı flag adı tekrar edemez
    CONSTRAINT room_custom_flag_unique UNIQUE (room_id, flag_name)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_room_custom_flags_room_id 
ON public.room_custom_flags(room_id);

-- =====================================================
-- 3. Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE public.room_custom_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Oda katılımcıları custom flag'leri görebilir
CREATE POLICY "Room participants can view custom flags"
    ON public.room_custom_flags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = room_custom_flags.room_id
            AND rp.user_key::uuid = auth.uid()
        )
    );

-- Policy: Sadece admin custom flag ekleyebilir
CREATE POLICY "Admins can insert custom flags"
    ON public.room_custom_flags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = room_custom_flags.room_id
            AND rp.user_key::uuid = auth.uid()
            AND rp.is_admin = true
        )
    );

-- Policy: Sadece admin custom flag silebilir
CREATE POLICY "Admins can delete custom flags"
    ON public.room_custom_flags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = room_custom_flags.room_id
            AND rp.user_key::uuid = auth.uid()
            AND rp.is_admin = true
        )
    );

-- =====================================================
-- Migration Tamamlandı
-- =====================================================

