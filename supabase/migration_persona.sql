-- Migration : ajout de la colonne persona_details
-- Exécutez ce SQL dans l'éditeur SQL de votre projet Supabase

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS persona_details JSONB;
