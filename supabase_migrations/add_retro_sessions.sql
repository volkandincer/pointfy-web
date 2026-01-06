-- =====================================================
-- Retro Sessions - Veritabanı Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır
-- Retro odalarında session bazlı yönetim için

-- =====================================================
-- 1. retro_sessions Tablosu Oluşturma
-- =====================================================

CREATE TABLE IF NOT EXISTS public.retro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Partial unique index: Bir odada sadece bir aktif session olabilir
CREATE UNIQUE INDEX IF NOT EXISTS idx_retro_sessions_active_per_room 
ON public.retro_sessions(room_id) 
WHERE is_active = true;

-- Indexler
CREATE INDEX IF NOT EXISTS idx_retro_sessions_room_id 
ON public.retro_sessions(room_id);

CREATE INDEX IF NOT EXISTS idx_retro_sessions_is_active 
ON public.retro_sessions(room_id, is_active);

-- =====================================================
-- 2. retro_cards Tablosuna retro_session_id Ekleme
-- =====================================================

ALTER TABLE public.retro_cards
ADD COLUMN IF NOT EXISTS retro_session_id UUID REFERENCES public.retro_sessions(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_retro_cards_session_id 
ON public.retro_cards(retro_session_id);

-- =====================================================
-- 3. RLS Policies
-- =====================================================

ALTER TABLE public.retro_sessions ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (oda katılımcıları)
DROP POLICY IF EXISTS "retro_sessions_select" ON public.retro_sessions;
CREATE POLICY "retro_sessions_select"
    ON public.retro_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = retro_sessions.room_id
        )
    );

-- Sadece admin oluşturabilir
DROP POLICY IF EXISTS "retro_sessions_insert" ON public.retro_sessions;
CREATE POLICY "retro_sessions_insert"
    ON public.retro_sessions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = retro_sessions.room_id
            AND r.created_by_key::uuid = auth.uid()
        )
    );

-- Sadece admin güncelleyebilir
DROP POLICY IF EXISTS "retro_sessions_update" ON public.retro_sessions;
CREATE POLICY "retro_sessions_update"
    ON public.retro_sessions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = retro_sessions.room_id
            AND r.created_by_key::uuid = auth.uid()
        )
    );

-- Sadece admin silebilir
DROP POLICY IF EXISTS "retro_sessions_delete" ON public.retro_sessions;
CREATE POLICY "retro_sessions_delete"
    ON public.retro_sessions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = retro_sessions.room_id
            AND r.created_by_key::uuid = auth.uid()
        )
    );

-- =====================================================
-- 4. Function: Complete Session and Delete Cards Without Action Items
-- =====================================================

CREATE OR REPLACE FUNCTION complete_retro_session_and_cleanup(session_id_param UUID)
RETURNS void AS $$
BEGIN
    -- Session'ı tamamla
    UPDATE public.retro_sessions
    SET completed_at = NOW(),
        is_active = false
    WHERE id = session_id_param;
    
    -- Bu session'a ait aksiyon maddesi olmayan kartları sil
    DELETE FROM public.retro_cards
    WHERE retro_session_id = session_id_param
    AND id NOT IN (
        SELECT DISTINCT retro_card_id 
        FROM public.retro_action_items 
        WHERE retro_card_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

