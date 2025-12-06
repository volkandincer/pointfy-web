-- =====================================================
-- Rollback Voting Card Type - Veritabanı Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır
-- voting_card_type özelliğini geri almak için

-- =====================================================
-- 1. Constraint'i Kaldır
-- =====================================================

ALTER TABLE public.rooms
DROP CONSTRAINT IF EXISTS voting_card_type_check;

-- =====================================================
-- 2. Kolonu Kaldır (Opsiyonel - Eğer tamamen kaldırmak istiyorsanız)
-- =====================================================

-- NOT: Eğer kolonu tamamen kaldırmak istiyorsanız aşağıdaki satırın yorumunu kaldırın
-- ALTER TABLE public.rooms DROP COLUMN IF EXISTS voting_card_type;

-- Veya sadece NULL yapmak istiyorsanız (verileri korumak için):
-- UPDATE public.rooms SET voting_card_type = NULL;

-- =====================================================
-- 3. Index'i Kaldır
-- =====================================================

DROP INDEX IF EXISTS idx_rooms_voting_card_type;

-- =====================================================
-- Rollback Tamamlandı
-- =====================================================

