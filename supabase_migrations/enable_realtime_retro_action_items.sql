-- =====================================================
-- Retro Action Items - Realtime Açma
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır
-- retro_action_items tablosu için realtime özelliğini aktifleştirir

-- =====================================================
-- Realtime Publication'a Tablo Ekleme
-- =====================================================

-- Supabase'de realtime publication'ına retro_action_items tablosunu ekle
-- Eğer publication yoksa otomatik oluşturulur
ALTER PUBLICATION supabase_realtime ADD TABLE retro_action_items;

-- =====================================================
-- Alternatif: Manuel Publication Oluşturma (Gerekirse)
-- =====================================================
-- Eğer yukarıdaki komut çalışmazsa, aşağıdaki komutları kullanın:

-- CREATE PUBLICATION supabase_realtime FOR TABLE retro_action_items;

-- =====================================================
-- Kontrol: Realtime'ın Aktif Olduğunu Doğrulama
-- =====================================================
-- Aşağıdaki sorgu ile kontrol edebilirsiniz:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'retro_action_items';

-- =====================================================
-- Notlar
-- =====================================================
-- 1. Supabase Dashboard > Database > Realtime bölümünden de kontrol edebilirsiniz
-- 2. Tablo için realtime'ın açık olduğundan emin olun
-- 3. RLS (Row Level Security) politikaları realtime'ı etkilemez
-- 4. Realtime subscription'ları sadece INSERT, UPDATE, DELETE event'lerini dinler

