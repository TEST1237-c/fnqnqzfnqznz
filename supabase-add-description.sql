-- Ajoute la colonne description à la table content
-- À exécuter dans Supabase : SQL Editor > New query > Coller > Run

ALTER TABLE content ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
