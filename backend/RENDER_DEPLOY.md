# Render Backend Deploy

Use Render only for the `backend` service in this repo.

## Render settings

- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

## Why `npm start` does not run `prisma db push`

This project is often booted against an imported MySQL dump such as `fashion_store.sql`.
Running `prisma db push` on every boot is unsafe because old rows can violate new foreign keys and block the whole deploy.

The failure you hit on Render:

```text
product_reviews_user_id_fkey
```

means `product_reviews.user_id` contains values that do not exist in `users.id`.

## Empty database

If the target database is empty and you want Prisma to create the schema once, run:

```bash
npm run prisma:push
node dist/prisma/seed_permissions.js
```

After that, keep the service Start Command as:

```bash
npm start
```

If you really want a single command for the first boot only, use:

```bash
npm run start:bootstrap
```

Do not keep `start:bootstrap` as the permanent Start Command on Render.

## Existing imported database

If deploy logs fail on `product_reviews_user_id_fkey`, repair orphan review users first:

```sql
UPDATE product_reviews pr
LEFT JOIN users u ON pr.user_id = u.id
SET pr.user_id = NULL
WHERE pr.user_id IS NOT NULL AND u.id IS NULL;
```

Then, if you still need to sync the schema once, run:

```bash
npm run prisma:push
```
