-- =====================================================
-- Varsayılan "Unorganized" Board Oluşturma (Opsiyonel)
-- =====================================================
-- Bu script, mevcut kullanıcılar için varsayılan bir board oluşturur
-- Sadece isterseniz çalıştırın

-- Her kullanıcı için "Unorganized" board oluştur
-- Mevcut task'lar ve notlar bu board'a atanmayacak (board_id = null kalacak)
-- Bu sadece kullanıcıların hemen bir board'ı olsun diye

INSERT INTO public.user_boards (user_key, name, description, color, icon, position, is_archived, is_deleted)
SELECT DISTINCT
    user_key::UUID,
    'Unorganized' as name,
    'Organize edilmemiş içerikler' as description,
    '#9CA3AF' as color, -- Gray color
    '📋' as icon,
    0 as position,
    false as is_archived,
    false as is_deleted
FROM (
    SELECT DISTINCT user_key::UUID as user_key FROM public.user_personal_tasks
    UNION
    SELECT DISTINCT user_key::UUID as user_key FROM public.notes
) AS all_users
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_boards 
    WHERE user_boards.user_key = all_users.user_key 
    AND user_boards.name = 'Unorganized'
    AND user_boards.is_deleted = false
)
ON CONFLICT DO NOTHING;

-- Not: Eğer mevcut task'ları ve notları bu board'a atamak isterseniz:
-- UPDATE public.user_personal_tasks 
-- SET board_id = (SELECT id FROM public.user_boards WHERE user_key = user_personal_tasks.user_key AND name = 'Unorganized' LIMIT 1)
-- WHERE board_id IS NULL;

-- UPDATE public.notes 
-- SET board_id = (SELECT id FROM public.user_boards WHERE user_key = notes.user_key AND name = 'Unorganized' LIMIT 1)
-- WHERE board_id IS NULL;

