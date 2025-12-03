-- =====================================================
-- Retro Action Items - Veritabanı Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır
-- Retro odalarında admin'in aksiyon maddeleri ekleyebilmesi için

-- =====================================================
-- 1. retro_action_items Tablosu Oluşturma
-- =====================================================

CREATE TABLE IF NOT EXISTS public.retro_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by_key UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by_username TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: Content boş olamaz
    CONSTRAINT action_item_content_not_empty CHECK (char_length(trim(content)) > 0),
    
    -- Constraint: Position negatif olamaz
    CONSTRAINT action_item_position_non_negative CHECK (position >= 0)
);

-- =====================================================
-- 2. Indexler
-- =====================================================

CREATE INDEX idx_retro_action_items_room_id ON public.retro_action_items(room_id);
CREATE INDEX idx_retro_action_items_room_completed ON public.retro_action_items(room_id, is_completed);
CREATE INDEX idx_retro_action_items_position ON public.retro_action_items(room_id, position);

-- =====================================================
-- 3. updated_at Otomatik Güncelleme Trigger'ı
-- =====================================================

CREATE OR REPLACE FUNCTION update_retro_action_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_retro_action_items_updated_at
    BEFORE UPDATE ON public.retro_action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_retro_action_items_updated_at();

-- =====================================================
-- 4. Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE public.retro_action_items ENABLE ROW LEVEL SECURITY;

-- Policy: Oda katılımcıları aksiyon maddelerini görebilir
CREATE POLICY "Room participants can view action items"
    ON public.retro_action_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = retro_action_items.room_id
            AND rp.user_key = auth.uid()
        )
    );

-- Policy: Sadece admin aksiyon maddesi ekleyebilir
CREATE POLICY "Admins can insert action items"
    ON public.retro_action_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = retro_action_items.room_id
            AND rp.user_key = auth.uid()
            AND rp.is_admin = true
        )
    );

-- Policy: Sadece admin aksiyon maddelerini güncelleyebilir
CREATE POLICY "Admins can update action items"
    ON public.retro_action_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = retro_action_items.room_id
            AND rp.user_key = auth.uid()
            AND rp.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = retro_action_items.room_id
            AND rp.user_key = auth.uid()
            AND rp.is_admin = true
        )
    );

-- Policy: Sadece admin aksiyon maddelerini silebilir
CREATE POLICY "Admins can delete action items"
    ON public.retro_action_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = retro_action_items.room_id
            AND rp.user_key = auth.uid()
            AND rp.is_admin = true
        )
    );

-- =====================================================
-- Migration Tamamlandı
-- =====================================================

