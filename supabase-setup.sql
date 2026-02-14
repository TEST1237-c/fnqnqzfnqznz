-- Exécute ce SQL dans Supabase (SQL Editor) pour créer la table
-- Dashboard Supabase > SQL Editor > New query

CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('film', 'serie')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT,
  video_url TEXT NOT NULL,
  duration TEXT DEFAULT '-',
  year TEXT DEFAULT '-',
  genre TEXT DEFAULT '-',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- S'assure que la colonne description existe (si la table existait déjà)
ALTER TABLE content ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Autoriser lecture publique
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique" ON content;
CREATE POLICY "Lecture publique" ON content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert publique" ON content;
CREATE POLICY "Insert publique" ON content
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update publique" ON content;
CREATE POLICY "Update publique" ON content
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Delete publique" ON content;
CREATE POLICY "Delete publique" ON content
  FOR DELETE USING (true);
