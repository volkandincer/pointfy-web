-- =====================================================
-- Fix Votes Table RLS Policies
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır
-- Votes tablosu için RLS politikalarını düzeltir

-- =====================================================
-- 1. RLS'i Aktif Et (Eğer yoksa)
-- =====================================================

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. Mevcut Politikaları Temizle (Eğer varsa)
-- =====================================================

DROP POLICY IF EXISTS "Room participants can view votes" ON public.votes;
DROP POLICY IF EXISTS "Users can view their own votes" ON public.votes;
DROP POLICY IF EXISTS "Admins can view all votes" ON public.votes;
DROP POLICY IF EXISTS "Room participants can insert votes" ON public.votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;

-- =====================================================
-- 3. Yeni RLS Politikaları
-- =====================================================

-- Policy: Oda katılımcıları vote'ları görebilir
-- Admin'ler her zaman tüm vote'ları görebilir
-- Task completed ise tüm katılımcılar görebilir
CREATE POLICY "Room participants can view votes"
    ON public.votes
    FOR SELECT
    USING (
        -- Oda katılımcısı ise görebilir
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = votes.room_id
            AND (
                -- Admin ise tüm vote'ları görebilir
                (rp.user_key::uuid = auth.uid() AND rp.is_admin = true)
                OR
                -- Normal katılımcı ise:
                -- 1. Kendi vote'unu görebilir
                (rp.user_key::uuid = auth.uid() AND votes.user_key::uuid = auth.uid())
                OR
                -- 2. Task completed ise tüm vote'ları görebilir
                (rp.user_key::uuid = auth.uid() AND EXISTS (
                    SELECT 1 FROM public.tasks t
                    WHERE t.id = votes.task_id
                    AND t.status = 'completed'
                ))
            )
        )
    );

-- Policy: Oda katılımcıları puan verebilir
CREATE POLICY "Room participants can insert votes"
    ON public.votes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = votes.room_id
            AND rp.user_key::uuid = auth.uid()
        )
        AND user_key::uuid = auth.uid()
    );

-- Policy: Kullanıcılar kendi puanlarını güncelleyebilir
CREATE POLICY "Users can update their own votes"
    ON public.votes
    FOR UPDATE
    USING (user_key::uuid = auth.uid())
    WITH CHECK (
        user_key::uuid = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.room_participants rp
            INNER JOIN public.rooms r ON r.code::text = rp.room_code::text
            WHERE r.id = votes.room_id
            AND rp.user_key::uuid = auth.uid()
        )
    );

-- Policy: Kullanıcılar kendi puanlarını silebilir (opsiyonel)
CREATE POLICY "Users can delete their own votes"
    ON public.votes
    FOR DELETE
    USING (user_key::uuid = auth.uid());

-- =====================================================
-- 4. Realtime'ı Aktif Et (Eğer yoksa)
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- =====================================================
-- 5. Index'ler (Performans için)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_votes_room_id ON public.votes(room_id);
CREATE INDEX IF NOT EXISTS idx_votes_task_id ON public.votes(task_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_key ON public.votes(user_key);
CREATE INDEX IF NOT EXISTS idx_votes_room_task ON public.votes(room_id, task_id);

-- =====================================================
-- Migration Tamamlandı
-- =====================================================

