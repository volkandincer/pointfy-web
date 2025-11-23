-- =====================================================
-- Bitbucket OAuth Entegrasyonu - Rollback Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılarak
-- Bitbucket OAuth entegrasyonu geri alınır

-- =====================================================
-- 1. Trigger'ı Kaldır
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =====================================================
-- 2. Index'leri Kaldır
-- =====================================================

DROP INDEX IF EXISTS idx_users_bitbucket_uuid;

-- =====================================================
-- 3. Bitbucket Kolonlarını Kaldır
-- =====================================================

ALTER TABLE public.users
DROP COLUMN IF EXISTS bitbucket_access_token,
DROP COLUMN IF EXISTS bitbucket_refresh_token,
DROP COLUMN IF EXISTS bitbucket_token_expires_at,
DROP COLUMN IF EXISTS bitbucket_username,
DROP COLUMN IF EXISTS bitbucket_uuid;

-- =====================================================
-- Rollback Tamamlandı
-- =====================================================
-- Not: Bu migration çalıştırıldıktan sonra:
-- 1. Bitbucket OAuth ile bağlanmış kullanıcıların token'ları silinir
-- 2. Kullanıcılar tekrar Bitbucket bağlantısı yapmak zorunda kalır
-- 3. Jira görevleri görüntüleme özelliği çalışmaz


