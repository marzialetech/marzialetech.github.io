# Unified Supabase Auth Setup

All marziale.tech apps now use **one Supabase project** (Project 2: `qvrrlfzogtuahmvsbvmu`). Login from the main homepage applies everywhere.

## 1. Add Milk Chase table to Project 2

In the [Supabase Dashboard](https://supabase.com/dashboard) for Project 2 (`qvrrlfzogtuahmvsbvmu`):

1. Open **SQL Editor** and run the contents of `projects/milk-chase/ADD_TO_PROJECT2.sql`.
2. In **Authentication → URL Configuration → Redirect URLs**, add:
   - `https://marziale.tech`
   - `https://marziale.tech/**`

## 2. (Optional) Migrate Milk Chase scores from Project 1

If you want to keep existing Milk Chase scores from the old project:

1. In **Project 1** (`nkhsbiqvnhvbfsxktzkc`): Table Editor → `milk_chase_scores` → export as CSV or use SQL to copy data.
2. In **Project 2**: after running `ADD_TO_PROJECT2.sql`, insert the rows into `milk_chase_scores` (Table Editor or SQL Editor).

Fitness data already lives in Project 2; no migration needed.

## 3. Test

1. Open https://marziale.tech and click the **Login** icon.
2. Sign in with GitHub in the login window.
3. Visit https://marziale.tech/projects/ — you should be recognized as admin (no overlay).
4. Visit https://marziale.tech/projects/fitness/ — you should see your signed-in state.
5. Visit https://marziale.tech/projects/milk-chase/ — leaderboard should work (same project).

## 4. Delete old project (optional)

After everything works, in the Supabase dashboard you can **delete Project 1** (`nkhsbiqvnhvbfsxktzkc`) to stay within the free project limit.
