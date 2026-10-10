# Vercel + Supabase deployment

## Local behavior

Local development remains unchanged:

```bash
npm run dev
```

This starts the existing PHP API at `http://localhost:8000/index.php` and the Vite frontend. The default frontend API URL remains the PHP URL.

## Online behavior

Vercel serves the frontend and the Node.js API function in `api/index.js`. PHP is not used by the Vercel deployment. The local `api-php` directory remains in the repository only for local development and rollback.

Supabase PostgreSQL is used online. Supabase Storage is used for profile photos and complaint attachments because Vercel function storage is temporary.

## Supabase setup

1. Open the Supabase SQL editor.
2. Run `api-php/schema.supabase.sql` against the online project.
3. Create a private Storage bucket named `uploads`, or use the value configured by `SUPABASE_STORAGE_BUCKET`.
4. Keep the service-role key server-side only. Never use it as a `VITE_` variable.

The schema script is additive and does not delete application data. Do not run `api-php/schema.mysql.sql` against Supabase.

## Vercel environment variables

Configure these in the Vercel project settings for Production and Preview as appropriate:

```env
VITE_API_BASE_URL=/api
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVER-ONLY SERVICE ROLE KEY]
SUPABASE_STORAGE_BUCKET=uploads
JWT_SECRET=[LONG RANDOM SECRET]
DB_CONNECTION_LIMIT=10
FRONTEND_ORIGIN=https://[YOUR-VERCEL-DOMAIN]
SEED_PASSWORD=[OPTIONAL SECRET]
```

`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` must not be exposed through frontend variables.

## Deploy

From the project root:

```bash
npm install
npm run build --workspace @workspace/mockup-sandbox
```

Then import the repository into Vercel. Deployment is configured in `vercel.json` at the repository root and in `artifacts/api-server/vercel.json`. Either leave **Root Directory** empty (repository root) or set it to `artifacts/api-server`; the shared build script in `artifacts/api-server/scripts/vercel-build.mjs` resolves the monorepo root, builds the Vite frontend, and stages the static `dist` folder plus `api/index.js` for the serverless API.

After deployment, verify:

```text
https://[YOUR-VERCEL-DOMAIN]/api/health
```

Expected response:

```json
{"status":"ok"}
```

## API compatibility

The online API preserves the existing frontend paths, including authentication, users, TODAs, drivers, complaints, attachments, notifications, violations, reports, dashboard, and seed routes. The frontend only changes its base URL from the local PHP URL to `/api` in the online build.

## Important limitations

- Vercel functions are stateless. Uploaded files must use Supabase Storage; do not rely on local disk storage online.
- The online database is PostgreSQL, so the online API uses the PostgreSQL driver. `mysql2/promise` cannot connect to Supabase PostgreSQL. Local development continues to use the existing PHP/MySQL implementation.
- Run the security scenarios in `api-php/security-test-scenarios.md` against the online API before removing PHP from any production deployment process.
- Do not remove `api-php` until the online API has passed functional and security verification.
