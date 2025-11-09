-- Not: Bu script Supabase'deki notes tablosundaki category constraint'ini kaldırır
-- Böylece custom kategoriler kaydedilebilir
-- Supabase SQL Editor'da çalıştırın

-- Önce constraint'in adını bulalım (genellikle check_note_category veya benzeri)
-- Constraint'i kaldır
ALTER TABLE notes DROP CONSTRAINT IF EXISTS check_note_category;

-- Alternatif olarak, eğer constraint farklı bir isimle tanımlanmışsa:
-- ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_category_check;

-- Kontrol için:
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid = 'notes'::regclass AND contype = 'c';

