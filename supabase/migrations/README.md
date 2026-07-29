# Supabase migration workflow

Production database changes belong in this directory and must use a timestamped
filename. Apply them in order with the Supabase CLI after reviewing the diff.

The first migration, `20260729000000_secure_admin_access.sql`, is the secured
admin/RLS migration already applied to the current project. Keep it immutable;
future changes must be new migration files rather than edits to an old one.

## Before every production migration

Create and retain a database backup outside Git:

```bash
mkdir -p supabase/backups
supabase db dump --linked --file "supabase/backups/pre-migration-$(date +%Y%m%d-%H%M%S).sql"
```

Review the migration, apply it from a linked project, and inspect the result:

```bash
supabase db diff --linked
supabase db push --linked
```

Run the application smoke tests after deployment. If a migration fails, stop,
restore from the backup using your approved Supabase recovery process, and do
not edit an already-applied migration to try to repair history.

## Bootstrap versus production

`supabase_schema.sql` is a destructive disposable-database bootstrap. It
truncates and reseeds application tables and must never be used for production
or for a database containing real configuration.

For an existing or production database, use only the versioned migrations in
this directory. The root-level `supabase_admin_rpc_functions.sql` remains as a
copy/paste compatibility file for the Supabase SQL Editor; the versioned file
is the source of truth for CLI deployment.

Backup files are ignored by Git. Never commit database dumps, credentials, or
Supabase service-role keys.
