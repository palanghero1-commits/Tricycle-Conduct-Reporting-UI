# SOS implementation report

## Delivered

- Student SOS screen with an immediate online alert, optional GPS location, student ID, and an optional short emergency detail.
- One-time Android student setup modal on the main dashboard after login: a single action registers the phone, requests location permission (optional), and caches the student profile, driver list, report categories, reports, and notifications. The modal shows live progress and a completion state. Students can defer setup and register later from Emergency SOS.
- Android phone registration for a verified student account. Offline identity and pending SOS data are encrypted with AES/GCM using a key held in Android Keystore.
- If the API cannot be reached, Android prepares an SMS addressed to the configured monitored number. The student must send it in their messaging app. The screen says it is **not sent** until the student confirms sending.
- If SMS is sent offline, confirmation is stored on the phone and reported to the server after the student signs in and reconnects. Authorized personnel see it as a delayed alert, with a reminder that SMS delivery was reported by the student.
- Android app-icon SOS shortcut (long-press the app icon), student navigation shortcut, and an authorized personnel/admin monitor with acknowledge and resolve controls.
- SOS APIs in both the Node/Vercel API and PHP API, including role checks, device ownership checks, deduplication IDs, and a feature flag.

## Required setup before live use

1. Apply [`api-php/migrations/supabase/009-sos-device-registration.sql`](api-php/migrations/supabase/009-sos-device-registration.sql) to the Supabase project. For a MySQL deployment, apply [`api-php/migrations/mysql/009-sos-device-registration.sql`](api-php/migrations/mysql/009-sos-device-registration.sql) once after the earlier SOS migration. The MySQL migration is a one-time migration and is not rerunnable as written.
2. Deploy the updated `api/index.js` and `api/sos-routes.js` backend. The Android app’s configured API currently returns HTTP 404 for `POST /sos/devices`, which means the deployed API does not yet expose the phone-registration endpoint.
3. Set `SOS_ENABLED=true` in the deployed API environment. It defaults to disabled.
4. Set `VITE_SOS_SMS_NUMBER` in the Android build environment to the official, monitored emergency SMS number. The value is compiled into the Android app. No number was supplied, so no recipient was invented; offline SMS remains unavailable until this is configured.
5. Build and distribute a new Android app. The debug APK built in this workspace is `artifacts/mockup-sandbox/android/app/build/outputs/apk/debug/app-debug.apk`.

The SMS route opens the phone's messaging app; it does not silently transmit SMS or require `SEND_SMS` permission. If the device has no cellular service, the phone cannot deliver the text. The app retains the alert locally and clearly leaves it unconfirmed until the student can send the SMS. Online reporting also needs the server and database migration above.

## Verification completed

- `npm run typecheck` — passed.
- `npm run build:android` — passed; Vite build and Capacitor Android sync completed.
- `node --check api/index.js` and `node --check api/sos-routes.js` — passed.
- `php -l api-php/index.php` — passed.
- `gradlew assembleDebug` — passed; the Android debug APK was produced.

No live SMS or database integration test was run. Manual test cases below should be completed on a test student account, test responder account, Android phone, and an approved test SMS destination before production use. Do not send test SOS messages to a live emergency number.

## Manual test cases

| Case | Steps | Expected result |
|---|---|---|
| Register a phone | On Android, sign in as a student with a valid student ID while online; open Emergency SOS and register this phone. | Registration succeeds; the screen shows the same student identity after closing and reopening the app. The backend records one device owned by that student. |
| First-login offline setup | Sign in on Android as a student who has not completed phone setup. Tap **Register phone & prepare offline** on the dashboard modal. | Modal shows stage and progress updates while phone registration and profile/drivers/categories/reports/notifications caching run. GPS permission is requested (but can be denied); success shows 100% and a continue button. |
| Defer first-login setup | On the dashboard modal tap **Do this later**. | Modal closes for this session; phone setup is offered again on a later login and remains available from Emergency SOS. |
| Reject nonstudent or invalid account | Try registration while signed in as a driver/personnel account, or as a student with no valid student profile. | Registration is rejected; no offline identity is saved. |
| Online SOS | With API enabled and reachable, allow GPS and press **SEND SOS**. | One active alert appears in the personnel monitor with student identity and coordinates where available. The student screen shows active status. |
| Online SOS without GPS | Deny location permission or disable device location, then send while online. | Alert still reaches personnel and identity remains visible; monitor says location is unavailable and does not show a false map location. |
| App-icon shortcut | Long-press the Android app icon and choose **Open Emergency SOS**, with the app closed and then with it already open. | App opens the SOS screen in both cases. |
| Offline SMS preparation | Register the phone online first, then enable airplane mode while keeping SMS service available (turn cellular back on if needed). Press SOS. | SMS composer opens with the configured destination and student identity/location in the body. Screen does not claim delivery. |
| Confirm SMS sent | Send the prepared message in the SMS app, return to SOS, and tap **I sent this SMS**. | Local pending status becomes “SMS marked sent”; when online and signed in, server receives one delayed alert. If still offline, it remains pending locally. |
| No cellular signal | Disable cellular service and try the offline SMS flow. Do not press Send if the messaging app reports no service. | App makes no claim that the alert was delivered. Alert remains unconfirmed/pending; no personnel alert appears until SMS delivery or later online report. |
| Pending alert survives restart | Prepare SMS, close/reopen the app, and open SOS from the shortcut. | Encrypted pending alert is still shown, with its sent/unconfirmed state. The SMS can be reopened. |
| Sync after login | Mark SMS sent while offline/logged out; reconnect, sign in as the same student, and open SOS. | Confirmed pending alert syncs once and appears as a delayed alert. |
| Personnel response | As authorized personnel, acknowledge then resolve an active alert. | Alert shows acknowledged state and is removed from the active list after resolution. A student cannot use the personnel resolution endpoint. |
| Duplicate request | Retry the same alert ID in an API-level test. | API returns the existing alert; no duplicate active alert or notification is created. |
| Authorization/ownership | Try using another student's device ID, opening the monitor as a student, or sending offline sync without `smsConfirmed: true`. | API rejects each request; another account cannot register or use the device. |
| Feature flag | Deploy with `SOS_ENABLED` unset/false and call an SOS endpoint. | API returns the disabled response; SOS cannot be registered or sent. |

