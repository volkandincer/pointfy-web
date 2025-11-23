-- =====================================================
-- Jira URL Saklama - Veritabanı Migration
-- =====================================================
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır

-- =====================================================
-- users Tablosuna Jira URL Kolonu Ekleme
-- =====================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS jira_base_url TEXT;

-- =====================================================
-- Index (Opsiyonel - Arama için)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_jira_base_url ON public.users(jira_base_url) WHERE jira_base_url IS NOT NULL;

-- =====================================================
-- Migration Tamamlandı
-- =====================================================


