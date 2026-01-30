# How to Delete Rows in Supabase

There are several ways to delete rows from your `milk_chase_scores` table in Supabase:

## Method 1: Using the Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Table Editor** in the left sidebar
3. Click on the `milk_chase_scores` table
4. Find the row you want to delete
5. Click on the row to select it (or use the checkbox)
6. Click the **Delete** button (trash icon) at the top
7. Confirm the deletion

## Method 2: Using SQL Editor

1. Go to **SQL Editor** in the left sidebar
2. Run one of these commands:

### Delete a specific row by ID:
```sql
DELETE FROM milk_chase_scores
WHERE id = 123;  -- Replace 123 with the actual ID
```

### Delete multiple rows by IDs:
```sql
DELETE FROM milk_chase_scores
WHERE id IN (123, 456, 789);  -- Replace with actual IDs
```

### Delete all rows (be careful!):
```sql
DELETE FROM milk_chase_scores;
```

### Delete rows matching certain criteria:
```sql
-- Delete all scores from a specific school
DELETE FROM milk_chase_scores
WHERE school = 'lowville';

-- Delete scores older than a certain date
DELETE FROM milk_chase_scores
WHERE created_at < '2024-01-01';

-- Delete scores with a specific player name
DELETE FROM milk_chase_scores
WHERE player_name = 'John Doe';
```

## Method 3: Using the Supabase REST API

You can also delete rows programmatically using the REST API, but the dashboard method is usually easier for manual deletions.

## Important Notes

- **Backup first**: Before deleting important data, consider exporting it first
- **Row Level Security (RLS)**: Your current RLS policies allow anonymous users to insert and select, but you may need to add a delete policy if you want to allow programmatic deletion
- **Cascading deletes**: If you have foreign key relationships, deleting a row might also delete related rows in other tables
