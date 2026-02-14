# Configuration Supabase (pour que tout le monde voie les films)

Pour que les films et séries ajoutés soient visibles par **tous les visiteurs** :

## Important : la description

Si la description ne se sauvegarde pas (ou « Aucune description » sur un autre PC), exécute ce fichier dans Supabase :

**`supabase-add-description.sql`** → SQL Editor → Copier-coller → Run

## 1. Crée un projet Supabase (gratuit)

1. Va sur [supabase.com](https://supabase.com) et crée un compte
2. Crée un nouveau projet
3. Note l’URL du projet et la clé "anon public" dans **Settings > API**

## 2. Crée la table

1. Dans le dashboard Supabase, ouvre **SQL Editor**
2. Clique sur **New query**
3. Copie-colle le contenu du fichier `supabase-setup.sql`
4. Exécute la requête (Run)

**Si tu as déjà créé la table avant** : exécute à nouveau le script complet (il inclut `ALTER TABLE content ADD COLUMN IF NOT EXISTS description` pour ajouter la colonne description si elle manque).

## 3. Configure ton projet

1. Ouvre `js/config.js`
2. Renseigne `https://blmdwnalmuwookrhdcqz.supabase.co` (ex : `https://xxxxx.supabase.co`)
3. Renseigne `SUPABASE_ANON_KEY` (ta clé anon publique)

## 4. Redéploie sur Vercel

Après la configuration, redéploie ton site. Les films et séries ajoutés seront désormais visibles pour tous les visiteurs.

---

**Sans Supabase** : les données restent dans le navigateur (localStorage) et ne sont visibles que pour toi sur ton appareil.
