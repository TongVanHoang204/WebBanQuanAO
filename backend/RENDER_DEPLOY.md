# Render Backend Deploy

Use Render for the `backend` service and Supabase Postgres for the database.

## Render settings

- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

## Required environment variables

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://postgres.pbiyscshjajuqoiqrwiv:your-database-password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.pbiyscshjajuqoiqrwiv:your-database-password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=https://your-frontend-domain.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
SUPABASE_URL=https://pbiyscshjajuqoiqrwiv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## First deploy on an empty Supabase database

Run this once:

```bash
npm run prisma:deploy
node dist/prisma/seed_permissions.js
```

After that, keep the Render Start Command as:

```bash
npm start
```

## Notes

- `DATABASE_URL` should use the Supabase transaction pooler on port `6543`.
- `DIRECT_URL` should use the session/direct migration connection on port `5432`.
- Do not put `VITE_SUPABASE_*` variables on the backend. Those are frontend-only.
