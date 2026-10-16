# App build and deployment guide

This guide describes how the Tricycle Conduct app is built, how the deployed web app reaches its API and database, and how to package the Android app.

## How the app is structured

- The user interface is a React and TypeScript app built with Vite in `artifacts/mockup-sandbox`.
- Capacitor packages that same web interface into an Android app. The Android project is in `artifacts/mockup-sandbox/android`.
- The online API is a Node.js/Express Vercel Function in `api/index.js`.
- The online database is Supabase PostgreSQL. The browser and Android app do not connect to PostgreSQL directly; they send HTTPS requests to the API.
- Local development uses the PHP API and MySQL. This is separate from the online Vercel and Supabase setup.

## How the deployed website reaches the API and database

For the website build, Vercel sets `VITE_API_BASE_URL=/api`. The frontend's API client in `artifacts/mockup-sandbox/src/lib/api.ts` sends requests to paths such as `/api/auth/login`. The Vercel rewrite in `vercel.json` forwards those requests to the serverless function at `api/index.js`.

The API reads the database URL from `SUPABASE_DB_URL` or `DATABASE_URL` and connects to PostgreSQL with the `pg` package. It also uses server-side variables such as `JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`. Keep these secrets in Vercel's Environment Variables; do not add them to frontend `VITE_` variables.

Supabase setup:

1. Run `api-php/schema.supabase.sql` in the Supabase SQL Editor.
2. Run any required additive SQL migrations in `api-php/migrations/supabase/`.
3. Create the private `uploads` Storage bucket for profile photos and report attachments.
4. Configure the database URL, Supabase URL and service-role key, JWT secret, and other server settings in Vercel.

Vercel's build script is `artifacts/api-server/scripts/vercel-build.mjs`. It builds the Vite frontend, stages the generated static files, and places the API function in the Vercel project output. The API server workspace declares the frontend workspace as a development dependency so Vercel's monorepo detection knows frontend changes affect this deployment.

## Build and run locally

Install workspace dependencies from the repository root:

```bash
npm install
```

Start local development:

```bash
npm run dev
```

This runs the local PHP API on port 8000, prepares the local MySQL database, and starts Vite. The Vite `/api` proxy sends API calls to the PHP server. Local PHP settings belong in the ignored file `api-php/config.php`; do not commit database passwords.

Build only the web frontend:

```bash
npm run build --workspace @workspace/mockup-sandbox
```

## Build the Android app

The Android build uses `.env.android`, which currently points the packaged app at the production API:

```env
VITE_API_BASE_URL=https://tricycle-conduct-reporting.vercel.app/api
```

Build the web assets in Android mode and sync them into the native Android project:

```bash
npm run build:android --workspace @workspace/mockup-sandbox
```

This runs `vite build --mode android` and then `cap sync android`. Capacitor copies the compiled web app into `android/app/src/main/assets/public` and syncs its Android plugins.

Open the project in Android Studio from the repository root:

```bash
npm run android:open --workspace @workspace/mockup-sandbox
```

Alternatively, open `artifacts/mockup-sandbox/android` directly in Android Studio and allow Gradle sync to finish. To build a debug APK from a terminal with Java and Android SDK configured:

```powershell
cd artifacts/mockup-sandbox/android
.\gradlew.bat assembleDebug
```

The debug APK is normally written to `app/build/outputs/apk/debug/app-debug.apk`. For distribution, use Android Studio's **Build > Generate Signed Bundle / APK** flow to create a signed release APK. Keep the signing key private and backed up.

The Android Studio project is a Capacitor WebView wrapper around the React app. Its `MainActivity` is written in **Java** (`MainActivity.java`), not Kotlin. The UI is TypeScript/React, and the Gradle build files use Groovy. Capacitor and Android dependencies may contain Kotlin internally, but this app does not use Kotlin for its own Android activity code.

## Deployment and troubleshooting notes

- After changing web code, the Vercel deployment must complete successfully before the production domain serves the new frontend.
- The Android APK contains the web assets from the last Android build and sync. Rebuild and reinstall the APK to include later UI changes.
- Android calls the online API URL in `.env.android`; changing the API requires rebuilding the APK.
- A Vercel HTTP 500 indicates an API/runtime/configuration problem. Check Vercel Function Logs and confirm its environment variables and Supabase schema.
- A GitHub deployment marked **inactive** can be an older deployment record. Check the latest deployment status in Vercel. The workspace dependency described above prevents Vercel from treating frontend changes as unrelated to the API-server project.
- In the previous Android packaging attempt, `cap sync` completed but Gradle could not produce an APK because Java was unavailable (`JAVA_HOME` was not set). A JDK and Android SDK are required for APK packaging.
