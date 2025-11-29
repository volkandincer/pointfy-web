-- =====================================================
-- Tasks Tablosuna Jira Alanları Ekleme
-- =====================================================
-- Bu migration tasks tablosuna Jira entegrasyonu için
-- gerekli alanları ekler

-- =====================================================
-- 1. Jira Alanlarını Ekle
-- =====================================================

-- jira_key: Jira issue key (örn: PROJ-123)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS jira_key TEXT;

-- jira_url: Jira issue URL'i
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS jira_url TEXT;

-- jira_id: Jira issue ID'si
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS jira_id TEXT;

-- =====================================================
-- 2. Indexler (Opsiyonel - performans için)
-- =====================================================

-- Jira key üzerinde index (Jira key ile arama yapılabilir)
CREATE INDEX IF NOT EXISTS idx_tasks_jira_key ON public.tasks(jira_key)
WHERE jira_key IS NOT NULL;

-- Jira ID üzerinde index
CREATE INDEX IF NOT EXISTS idx_tasks_jira_id ON public.tasks(jira_id)
WHERE jira_id IS NOT NULL;

-- =====================================================
-- 3. Yorumlar
-- =====================================================

COMMENT ON COLUMN public.tasks.jira_key IS 'Jira issue key (örn: PROJ-123)';
COMMENT ON COLUMN public.tasks.jira_url IS 'Jira issue URL''i';
COMMENT ON COLUMN public.tasks.jira_id IS 'Jira issue ID''si';

