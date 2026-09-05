# Tricycle Drivers Conduct Reporting System

Web and mobile-based PWA for SUNN students to submit tricycle driver conduct reports and for authorized Old Sagay TODA/admin/PNP personnel to review, document, and monitor complaints.

## Run & Operate

- `npm run dev` - run the UI preview.
- `npm run dev --workspace @workspace/api-server` - build and run the API server.
- `npm run typecheck` - full typecheck across all packages.
- `npm run build` - typecheck and build all packages.
- MySQL local schema: import `api-php/schema.mysql.sql`.
- MySQL local demo data: import `api-php/seed.mysql.sql` or call `POST /seed`.
- PHP local API: serve the `api-php` folder with Apache/XAMPP or PHP's built-in server.
- Seed baseline data after schema import: `POST /seed` on the PHP API base.

## Environment

- PHP config: copy `api-php/config.example.php` to `api-php/config.php` and set `db_host`, `db_name`, `db_user`, `db_pass`, `jwt_secret`, and `upload_dir`.
- `VITE_API_BASE_URL` - set this to the PHP API base, for example `http://localhost:8000/index.php`.
- The older Node/Express/PostgreSQL API remains available for Replit-style environments, but local deployment can use PHP + MySQL.

## Stack

- npm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Vite, React 19, Tailwind CSS 4, Radix UI, lucide-react
- API: PHP 8 with PDO for local MySQL deployments; Express 5 remains as an alternate Node API.
- DB: MySQL locally; PostgreSQL + Drizzle ORM remains as the Node API schema path.
- Auth: password hashes + HMAC JWT-style bearer sessions
- Validation: Zod
- Build: esbuild for API, Vite for frontend

## Where Things Live

- Frontend screens: `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting`
- Frontend API helper: `artifacts/mockup-sandbox/src/lib/api.ts`
- PHP API: `api-php/index.php`
- MySQL schema: `api-php/schema.mysql.sql`
- PHP config template: `api-php/config.example.php`
- API server: `artifacts/api-server/src`
- API domain routes: `artifacts/api-server/src/routes/domain.ts`
- Database schema: `lib/db/src/schema/index.ts`
- PWA assets: `artifacts/mockup-sandbox/public/manifest.webmanifest`, `public/sw.js`, `public/pwa-icon.svg`

## Architecture Decisions

- Complaints are reports, not confirmed violations. Violations are separate records created only by authorized roles.
- The backend derives complainant identity from the authenticated session; complaint creation never accepts a student user ID.
- Attachments are stored outside public frontend assets and are served only through an authenticated API endpoint.
- The service worker caches static UI assets only and bypasses API requests so offline mode does not fake complaint submission or notifications.
- Status changes are restricted to the configured workflow and always write status history plus audit records.

## Product

- Student registration/login and complaint submission with driver/category selection.
- TODA/admin/PNP complaint review, status updates, action records, confirmed violation creation, notifications, and database-backed reports.
- Admin management endpoints for users, drivers, and complaint categories.
- PWA installability and static offline fallback.

## Local Testing Accounts

After calling `POST /seed`, these accounts are available:

- Student: `student@sunn.edu.ph`
- Driver: `driver@oldsagay-toda.ph`
- Admin: `admin@oldsagay.gov.ph`
- TODA Officer: `officer@oldsagay.gov.ph`
- Password for all seeded accounts: `Password123!`

## User Preferences

- Preserve the existing visual design while replacing mock behavior with real functionality.

## Gotchas

- Run `npm run typecheck:libs` after schema edits so API project references see fresh DB declarations.
- For local PHP/MySQL, import `api-php/schema.mysql.sql` before using the API.
- For local PHP/MySQL, set `VITE_API_BASE_URL=http://localhost:8000/index.php` or the equivalent Apache/XAMPP URL.
- Seed records are required for the first driver/category/officer workflow.
