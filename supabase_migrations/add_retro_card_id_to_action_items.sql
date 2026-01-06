-- =====================================================
-- Retro Action Items - Kart Bağlantısı Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır
-- Aksiyon maddelerini retro kartlarına bağlama özelliği için

-- =====================================================
-- 1. retro_action_items Tablosuna retro_card_id Kolonu Ekleme
-- =====================================================

-- retro_card_id kolonu ekle (nullable, foreign key to retro_cards.id)
ALTER TABLE public.retro_action_items
ADD COLUMN IF NOT EXISTS retro_card_id UUID REFERENCES public.retro_cards(id) ON DELETE SET NULL;

-- =====================================================
-- 2. Index Ekleme
-- =====================================================

-- retro_card_id için index ekle
CREATE INDEX IF NOT EXISTS idx_retro_action_items_card_id 
ON public.retro_action_items(retro_card_id);

-- =====================================================
-- Migration Tamamlandı
-- =====================================================

