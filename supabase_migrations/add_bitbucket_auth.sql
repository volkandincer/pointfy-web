-- =====================================================
-- Bitbucket OAuth Entegrasyonu - Veritabanı Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır

-- =====================================================
-- 1. users Tablosuna Bitbucket OAuth Kolonları Ekleme
-- =====================================================

-- NOT: auth_provider kolonu kullanmıyoruz
-- Bunun yerine bitbucket_uuid ile kontrol ediyoruz:
-- - Eğer bitbucket_uuid NULL değilse → Bitbucket kullanıcısı
-- - Eğer bitbucket_uuid NULL ise → Email kullanıcısı
-- Bu yaklaşım Supabase Auth trigger'ları ile daha uyumlu

-- Bitbucket token'ları için kolonlar ekle
-- Not: Production'da bu token'ları Supabase Vault'ta saklamak daha güvenli olur
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bitbucket_access_token TEXT,
ADD COLUMN IF NOT EXISTS bitbucket_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS bitbucket_token_expires_at TIMESTAMPTZ;

-- Bitbucket kullanıcı bilgileri
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bitbucket_username TEXT,
ADD COLUMN IF NOT EXISTS bitbucket_uuid TEXT;

-- =====================================================
-- 2. Indexler
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_bitbucket_uuid ON public.users(bitbucket_uuid) WHERE bitbucket_uuid IS NOT NULL;

-- =====================================================
-- 3. Row Level Security (RLS) Policies
-- =====================================================

-- Token'lar zaten users tablosunda olduğu için mevcut RLS policies korunur
-- Kullanıcılar sadece kendi token'larını görebilir/güncelleyebilir

-- =====================================================
-- 4. Trigger Kontrolü (Opsiyonel)
-- =====================================================
-- Eğer Supabase Auth'un public.users tablosuna otomatik insert yapan bir trigger'ı varsa
-- ve bu trigger sorun çıkarıyorsa, aşağıdaki komutu çalıştırabilirsiniz:
-- 
-- NOT: Bu trigger'ı devre dışı bırakmak authentication'ı bozabilir!
-- Sadece gerekirse kullanın.
--
-- SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';
-- DROP TRIGGER IF EXISTS trigger_name ON public.users;

-- =====================================================
-- 4. Trigger Güncelleme (ÖNEMLİ - ZORUNLU)
-- =====================================================
-- Supabase Auth'un public.users tablosuna insert yapan trigger'ını güncelle
-- Bu trigger username ve email kolonlarını set etmeli
-- Eğer trigger yoksa oluştur, varsa güncelle

-- Önce mevcut trigger'ı ve function'ı kontrol et ve güncelle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1), 'user'),
    NEW.email,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, public.users.username),
    email = COALESCE(EXCLUDED.email, public.users.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur veya güncelle
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Migration Tamamlandı
-- =====================================================
-- Not: Token'ları şifrelemek için Supabase Vault kullanılabilir
-- Veya application level'da encryption yapılabilir
--
-- ÖNEMLİ: Eğer "Database error saving new user" hatası alıyorsanız:
-- 1. Migration'ı çalıştırdığınızdan emin olun
-- 2. Supabase Dashboard > Database > Triggers'da public.users tablosuna ait trigger'ları kontrol edin
-- 3. Eğer bir trigger sorun çıkarıyorsa, aşağıdaki SQL'i çalıştırarak trigger'ı güncelleyin:
--
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.users (id, username, email, created_at)
--   VALUES (
--     NEW.id,
--     COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
--     NEW.email,
--     NOW()
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();

