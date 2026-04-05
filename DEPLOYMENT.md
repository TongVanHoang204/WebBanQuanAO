# Deployment Guide

This repo is deployed as:

- `frontend` on Vercel
- `backend` on Render
- `database` on Supabase Postgres

## Backend environment

Create `backend/.env` from `backend/.env.example`.

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://postgres.pbiyscshjajuqoiqrwiv:your-database-password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.pbiyscshjajuqoiqrwiv:your-database-password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=https://your-frontend-domain.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
GOOGLE_CLIENT_ID=your-google-oauth-client-id
SUPABASE_URL=https://pbiyscshjajuqoiqrwiv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Frontend environment

Set these on Vercel for the `frontend` project:

```env
VITE_API_URL=https://your-backend-domain.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_SUPABASE_URL=https://pbiyscshjajuqoiqrwiv.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-publishable-key
```

## Build and run

### Backend

```bash
cd backend
npm install
npm run build
npm run prisma:deploy
node dist/prisma/seed_permissions.js
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

## Cloud deploy

### Vercel

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

### Render

- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

## Supabase connection notes

- `DATABASE_URL` should use the transaction pooler connection with `?pgbouncer=true`
- `DIRECT_URL` should use a non-transaction connection for Prisma migrations
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are for the backend Supabase client
- `VITE_SUPABASE_*` values are frontend-only
