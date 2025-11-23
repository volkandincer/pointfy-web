-- =====================================================
-- Jira OAuth Entegrasyonu - Veritabanı Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır

-- =====================================================
-- users Tablosuna Jira OAuth Kolonları Ekleme
-- =====================================================

-- Jira token'ları için kolonlar ekle
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS jira_access_token TEXT,
ADD COLUMN IF NOT EXISTS jira_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS jira_token_expires_at TIMESTAMPTZ;

-- =====================================================
-- Index (Opsiyonel)
-- =====================================================

-- Jira token'ları için index gerekli değil (kullanıcı bazında sorgulanıyor)

-- =====================================================
-- Migration Tamamlandı
-- =====================================================


