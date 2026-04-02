# Eye Test Dashboard

A production-ready web application for managing and reviewing eye test data. Built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Role-based dashboards** (Client & Admin)
- **Supabase Auth** with signup/login and automatic role assignment
- **Live data from Supabase Storage** — reads JSON metadata files from the `Eye_Test_logs` bucket
- **Editable Manual Rx** — inline editor that persists to a `manual_rx` database table
- **Paginated, searchable table** with TanStack Table
- **Metrics summary** — total AI eye tests and manual Rx entries
- **Dark mode** toggle
- **Toast notifications** for all actions

## Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | React 18, Vite, TypeScript                      |
| Styling   | Tailwind CSS v4, custom UI components           |
| Routing   | React Router v6                                 |
| Table     | TanStack Table v8                               |
| Backend   | Supabase (Auth, PostgreSQL, Storage)             |
| Deploy    | Vercel                                          |

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd eye-test-dashboard
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://bnwmmxidqrtixoarvnlm.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Set up the database

Run the SQL in `supabase/schema.sql` in your Supabase dashboard SQL editor. This creates:

- `profiles` table (auto-populated on signup via trigger)
- `manual_rx` table (for editable manual Rx entries)
- Row Level Security policies
- Auto-profile trigger on `auth.users`

### 4. Configure storage access

Make sure your `Eye_Test_logs` bucket has a storage policy allowing authenticated users to read:

```sql
CREATE POLICY "Authenticated users can read Eye_Test_logs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'Eye_Test_logs' AND auth.role() = 'authenticated');
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 6. Create an admin user

After signing up, update the profile role in Supabase:

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite with `npm run build` and output `dist`

The `vercel.json` file handles SPA routing rewrites.

## Project Structure

```
src/
├── api/             # Supabase API calls (auth, storage, manualRx)
├── components/
│   ├── common/      # LoadingSpinner, SearchBar
│   ├── dashboard/   # MetricsSummary, DataTable, EyePowerDisplay, ManualRxEditor
│   ├── layout/      # AppLayout, ProtectedRoute
│   └── ui/          # Button, Input, Card primitives
├── context/         # AuthContext (auth state + role)
├── hooks/           # useSessionData (fetch + merge storage + DB data)
├── lib/             # Supabase client, utility functions
├── pages/           # LoginPage, SignupPage, ClientDashboard, AdminDashboard
└── types/           # TypeScript interfaces
```
