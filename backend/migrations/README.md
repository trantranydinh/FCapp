# Database Migrations

This directory contains SQL migration files for database schema changes.

## How to Run Migrations

### Option 1: Using MySQL CLI
```bash
mysql -u <username> -p <database_name> < migrations/001_add_news_indices.sql
```

### Option 2: Using Node.js Script
```bash
node scripts/run-migrations.js
```

### Option 3: Manual Execution
1. Connect to your MySQL database
2. Copy and paste the SQL from the migration file
3. Execute the queries

## Migration Files

- `001_add_news_indices.sql` - Adds performance indices for news crawler (P3 optimization)

## Notes

- All indices use `IF NOT EXISTS` to prevent errors on re-run
- Safe to run multiple times
- Each migration is atomic and can be rolled back if needed
