-- =====================================================
-- Retro Room Timer - Veritabanı Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır
-- Retro odalarında admin'in timer başlatabilmesi için

-- =====================================================
-- 1. rooms Tablosuna Timer Alanları Ekleme
-- =====================================================
-- NOT: retro_timer_duration saniye cinsinden saklanır (örn: 15, 60, 180, 300, 600)

ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS retro_timer_duration INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retro_timer_started_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retro_timer_ended_at TIMESTAMPTZ DEFAULT NULL;

-- Constraint: Duration pozitif olmalı (saniye cinsinden)
ALTER TABLE public.rooms
ADD CONSTRAINT retro_timer_duration_positive CHECK (retro_timer_duration IS NULL OR retro_timer_duration > 0);

-- =====================================================
-- 2. Index
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rooms_retro_timer ON public.rooms(room_type, retro_timer_started_at)
WHERE room_type = 'retro' AND retro_timer_started_at IS NOT NULL;

-- =====================================================
-- 3. RLS Policy (Zaten var olabilir, kontrol edilmeli)
-- =====================================================

-- Rooms tablosu için RLS zaten aktif olmalı
-- Admin'ler timer başlatabilir, herkes okuyabilir

