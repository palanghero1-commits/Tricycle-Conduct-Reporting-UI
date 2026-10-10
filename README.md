# Tricycle Drivers Conduct Reporting System

Academic capstone system for SUNN students, drivers, TODA officers, administrators, and authorized personnel.

The local setup uses:

- Frontend: React + Vite
- Backend: PHP 8
- Database: MySQL
- Local API path: `api-php/index.php`

## Requirements

- Node.js and npm
- PHP 8 or newer
- MySQL or XAMPP/WAMP with MySQL
- phpMyAdmin, optional but recommended for importing SQL files

## 1. Install Frontend Dependencies

From the project root:

```bash
npm install
```

## 2. Create the MySQL Database

When you run `npm run dev`, the local setup checks `api-php/config.php` (or the example config if no local config exists). If the configured local MySQL database is missing or empty, it creates the database, installs the schema, and adds the starter superadmin account. It does not reset a database that already contains tables.

MySQL must be running, and the configured MySQL account must be allowed to create a database. For XAMPP, start MySQL in the XAMPP Control Panel first. If your MySQL user cannot create databases, you can create/import the schema manually with the commands below.

Import this file into MySQL or phpMyAdmin:

```text
api-php/schema.mysql.sql
```

Using terminal:

```bash
mysql -u root -p < api-php/schema.mysql.sql
```

This creates the database:

```text
tricycle_conduct
```

## 3. Add Demo/Test Data

Import this file after the schema:

```text
api-php/seed.mysql.sql
```

Using terminal:

```bash
mysql -u root -p tricycle_conduct < api-php/seed.mysql.sql
```

After importing, the `users` table should contain demo accounts.

## 4. Configure PHP Database Connection

Copy the example config:

```bash
copy api-php\config.example.php api-php\config.php
```

Edit:

```text
api-php/config.php
```

Example local XAMPP config:

```php
<?php
return [
    'db_host' => '127.0.0.1',
    'db_name' => 'tricycle_conduct',
    'db_user' => 'root',
    'db_pass' => '',
    'jwt_secret' => 'change-this-local-secret',
    'upload_dir' => dirname(__DIR__) . '/private-storage/uploads',
    'frontend_origin' => '*',
];
```

Do not commit `api-php/config.php`. It is ignored by Git.

## 5. Run the PHP API

First confirm PHP is using your computer's active configuration and has the required extensions:

```bash
php --ini
php -m
```

The module list must include:

```text
PDO
pdo_mysql
fileinfo
```

If `pdo_mysql` or `fileinfo` is missing, open the active `php.ini` shown by `php --ini`, enable these lines, then restart the terminal:

```ini
extension=pdo_mysql
extension=fileinfo
```

Do not use a committed `api-php/php.ini` from another computer unchanged. If you intentionally create a local `api-php/php.ini`, copy `api-php/php.ini.example` and update `extension_dir` to your own PHP `ext` folder.

For manual PHP API startup, initialize a missing or empty local MySQL database safely:

```bash
php api-php/setup-db.php
```

This does not execute the schema's destructive reset statements against an existing database with tables. `npm run dev` runs this setup automatically before starting the local servers.

From the project root:

```bash
php -S localhost:8000 -t api-php api-php/router.php
```

Test the API:

```text
http://localhost:8000/index.php/healthz
```

Expected response:

```json
{"status":"ok"}
```

## 6. Run the Frontend

Open a second terminal and run:

```bash
npm run dev
```

Open:

```text
http://localhost:5000/
```

The homepage appears first. Use the login/register button to open the login and registration form.

## Initial account

The seed process creates only the super admin account. Students, drivers, authorized personnel, TODA presidents, and PNP accounts must be created through the application workflows.

| Role | Email | Password |
| --- | --- | --- |
| Superadmin | `superadmin@oldsagay.gov.ph` | `Password123!` |

## Important Local URLs

Frontend:

```text
http://localhost:5000/
```

PHP API:

```text
http://localhost:8000/index.php
```

Health check:

```text
http://localhost:8000/index.php/healthz

## Account-management API

Authenticated account-creation routes enforce the role hierarchy:

| Endpoint | Allowed creator | Creates |
| --- | --- | --- |
| `POST /users/authorized-personnel` | `SUPERADMIN` | Authorized personnel or PNP |
| `POST /users/toda-presidents` | `AUTHORIZED_PERSONNEL`, `SUPERADMIN` | TODA president |
| `POST /drivers/accounts` | `TODA_PRESIDENT`, `AUTHORIZED_PERSONNEL`, `SUPERADMIN` | Driver; TODA-created accounts require no phone number |

Public `POST /auth/register` accepts only `STUDENT` and `DRIVER` and writes both the user account and the matching profile record in one transaction.
```

Login/register page directly:

```text
http://localhost:5000/preview/tricycle-reporting/Auth
```

## Common Error: Request Failed

If login shows:

```text
Request failed.
```

Check these:

1. MySQL is running.
2. `api-php/schema.mysql.sql` was imported.
3. `api-php/seed.mysql.sql` was imported.
4. `api-php/config.php` has the correct MySQL username and password.
5. PHP API is running:

```bash
php -d upload_max_filesize=5M -d post_max_size=28M -d max_file_uploads=5 -S localhost:8000 -t api-php api-php/router.php
```

6. The frontend is running:

```bash
npm run dev
```

## Database Files

Schema:

```text
api-php/schema.mysql.sql
```

Demo data:

```text
api-php/seed.mysql.sql
```

PHP config template:

```text
api-php/config.example.php
```

PHP API:

```text
api-php/index.php
```

## Verification Commands

Check PHP syntax:

```bash
php -l api-php/index.php
```

Check frontend TypeScript:

```bash
npm run typecheck --workspace @workspace/mockup-sandbox
```

Build the full project:

```bash
npm run build
```

## Local MySQL and Online Supabase Deployment

The PHP API supports both database environments. Local development keeps using MySQL with `api-php/config.php` copied from `config.example.php`. The hosted API can use Supabase PostgreSQL with `config.supabase.example.php`.

For Supabase:

1. Open the Supabase SQL Editor and run `api-php/schema.supabase.sql`.
2. Copy `api-php/config.supabase.example.php` to `api-php/config.php` on the PHP server.
3. Replace the Supabase host, database password, JWT secret, and frontend origin.
4. Keep the frontend local `.env` pointed at the local API:

```env
VITE_API_BASE_URL=http://localhost:8000/index.php
```

5. Set the hosted frontend environment variable to the hosted PHP API:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/index.php
```

The frontend never connects directly to Supabase. The PHP API owns database credentials and connects to either MySQL or PostgreSQL based on `db_driver`. The PHP server must have the `pdo_pgsql` extension enabled for the Supabase deployment.
