# Android location and push setup

## Location

The report form and Emergency SOS ask Android or the desktop browser for location only after the user taps the location action. Android uses the Capacitor Geolocation plugin; desktop uses the browser's geolocation prompt. The user can deny permission and enter the incident place manually. Live SOS tracking continues to use foreground browser geolocation while the SOS screen is active.

Run `api-php/migrations/supabase/008-complaint-gps-coordinates.sql` in Supabase so the online API can save captured report coordinates, accuracy, and capture time. Reports without GPS permission can still be submitted with the manually entered incident location.

## Android push notifications

Push delivery needs Firebase configuration in addition to the app code:

1. In Firebase Console, add an Android app whose package name is `ph.sagay.tricycleconductreporting` and download its `google-services.json` into `artifacts/mockup-sandbox/android/app/`. Keep this file private and out of source control.
2. In Supabase SQL Editor, run `api-php/migrations/supabase/007-push-notification-tokens.sql`.
3. Create a Firebase service account with Firebase Cloud Messaging access. Add its complete JSON as the Vercel environment variable `FIREBASE_SERVICE_ACCOUNT_JSON` for the backend deployment. Do not put the service account key in the APK or commit it.
4. Deploy the API changes, rebuild/sync the Android project, and build/install a fresh APK. In the app, open Notifications and tap **Enable notifications**. Android will show its notification permission prompt. Allow it to register this device.

Once configured, report submission and report status updates create the existing in-app notification and send a Firebase push to registered devices. A push registration or delivery failure is logged by the API; the in-app notification feed remains available.
