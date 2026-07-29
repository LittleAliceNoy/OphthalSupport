<div align="center">
<img width="1200" height="475" alt="OphthalSupport Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# OphthalSupport

A specialized surgical operation checklist generator designed for ophthalmic surgery workflows. This tool helps surgical teams quickly prepare for cases by managing surgeon preferences, procedure-specific tools, and cost estimations.

## Features

- **Surgeon-Specific Profiles**: Preset preferences for different surgeon groups.
- **Procedure Management**: Support for Cataract (Phaco), Glaucoma (GDI/Trab), Retina (PPV), and more.
- **Cost Estimation**: Automatic calculation based on health coverage types (CSMBS, SSS, UCS).
- **Interactive Checklists**: Real-time generation of surgical tool and action lists.
- **Dark Mode Support**: Optimized for hospital and clinical environments.

## Tech Stack

- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite 6
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Building for Production

To create a production build:
```bash
npm run build
```
The output will be in the `dist` folder.

## GitHub Pages deployment

The repository includes a GitHub Actions workflow that deploys the
`manage-action` branch to GitHub Pages after tests and a production build pass.

Before the first deployment:

1. In GitHub, open **Settings → Pages** and set the source to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions**, add these repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Push to `manage-action` or manually run the **Deploy to GitHub Pages** workflow.

The expected project-site URL is:
`https://littlealicenoy.github.io/OphthalSupport/`

Use only the public Supabase anon key. Never add a Supabase service-role key to
GitHub secrets used by the browser build.

## Supabase production setup

Do not run `supabase_schema.sql` against a production database. It is a
destructive bootstrap script for a disposable database and truncates the
application tables before seeding them.

For an existing database:

1. Use the versioned migration in `supabase/migrations/` with the Supabase CLI.
   Before applying it, create a backup and review the migration diff. The
   migration enables RLS, permits public reads for the checklist, and
   restricts writes and admin RPCs to authenticated users with
   `app_metadata.role = 'admin'`.
2. Create administrator accounts in Supabase Authentication with email and
   password sign-in enabled.
3. Set the administrator role in `app_metadata` using a trusted admin-only
   process. For example, in the Supabase SQL Editor:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

4. Sign in through the Admin page. The browser client uses only the public
   Supabase anon key; never put a service-role key in Vite environment
   variables or client-side code.

For a new disposable development database, run `supabase_schema.sql` first,
then apply the versioned migration to install the secured policies and RPC
permissions. Never run `supabase_schema.sql` against production.
