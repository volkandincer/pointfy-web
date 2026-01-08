-- =====================================================
-- Add is_spectator field to room_participants table
-- =====================================================
-- Bu migration room_participants tablosuna is_spectator field'ını ekler
-- İzleyiciler oy veremez, sadece görüntüleyebilir

-- =====================================================
-- 1. is_spectator field'ını ekle (eğer yoksa)
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'room_participants' 
        AND column_name = 'is_spectator'
    ) THEN
        ALTER TABLE public.room_participants
        ADD COLUMN is_spectator BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- 2. Index ekle (performans için)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_room_participants_is_spectator 
ON public.room_participants(is_spectator) 
WHERE is_spectator = true;

-- =====================================================
-- 3. Comment ekle
-- =====================================================

COMMENT ON COLUMN public.room_participants.is_spectator IS 
'İzleyici modu. İzleyiciler oy veremez, sadece görüntüleyebilir.';

-- =====================================================
-- Migration Tamamlandı
-- =====================================================

