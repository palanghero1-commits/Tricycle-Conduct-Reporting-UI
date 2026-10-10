# Offline Mode Implementation Report

## Purpose

The local application can now accept a student report even when the phone temporarily has no internet connection. The report is saved on the device first and is uploaded to the local API after the connection returns.

This implementation is local-only. It does not change the Supabase or Vercel deployment.

## How the offline flow works

1. The student opens **Submit report**.
2. During a successful online student login, the app displays a preparation screen and downloads the student's profile, current driver list, active report categories, existing reports, and notifications into IndexedDB.
3. The browser checks `navigator.onLine`.
4. If online, the report is sent directly to `POST /complaints`.
5. If offline, the form uses the cached drivers/categories and the report is saved in the browser's IndexedDB storage.
6. If location permission is allowed, latitude, longitude, accuracy, and capture time are saved with the report.
7. The student can view saved reports under **Pending reports**.
8. When the browser detects the `online` event, the app attempts to upload every saved report.
9. After a successful upload, the local copy is deleted.
10. If the upload fails, the report remains on the device with `Upload failed`, an error message, and an increased retry count.

## How offline GPS works

Offline mode does not calculate a location from the internet. The phone's operating system and browser use the available location sources, such as GPS, Wi-Fi positioning, or cell towers.

Therefore:

- Latitude and longitude can still be captured without internet when the device can determine its location.
- Location permission must be granted.
- GPS may take longer or be less accurate indoors.
- A text address or map preview may not be available while offline.
- The original coordinates are preserved and sent when the report is synchronized.

The saved data uses decimal coordinates, for example:

```text
latitude: 10.9447
longitude: 123.4245
accuracy: 22 meters
```

## Local storage design

Offline reports are stored in IndexedDB:

- Database: `tricycle-conduct-offline`
- Object store: `reports`
- Key: `localReportId`
- Example ID: `offline-<random-id>`

IndexedDB is used instead of only `localStorage` because it can store structured data and attached files more reliably.

The account-data store contains the last successful online snapshot for the signed-in student:

- signed-in user identity and role;
- student profile data;
- registered drivers available for report selection;
- active complaint categories and descriptions;
- the student's previously downloaded reports and notifications;
- the time the snapshot was downloaded.

The password is not stored in IndexedDB. The existing local session token remains in browser storage, so the student should sign in while online before switching to offline mode.

## Duplicate prevention

Every offline report receives a `localReportId`. The local MySQL database stores this ID and has a unique key for the student and local report ID.

If the browser retries the same report after a timeout, the API returns the already-created report instead of creating a duplicate.

The database change is in:

```text
api-php/migrations/006-offline-report-id.sql
```

## Files involved

- `artifacts/mockup-sandbox/src/lib/offlineReports.ts` — IndexedDB storage and synchronization.
- `artifacts/mockup-sandbox/src/lib/offlineAccount.ts` — caches account data after online login and reads it when offline.
- `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/Auth.tsx` — starts the student account-data download after login.
- `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/MyReports.tsx` — shows the last downloaded reports when offline.
- `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/Notifications.tsx` — shows the last downloaded notifications when offline.
- `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/SubmitReport.tsx` — saves reports when offline and includes GPS data.
- `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/PendingReports.tsx` — displays and manually synchronizes pending reports.
- `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/_shared/AppLayout.tsx` — online/offline indicator and automatic retry when the connection returns.
- `api-php/index.php` — accepts `localReportId` and prevents duplicate uploads.
- `api-php/migrations/006-offline-report-id.sql` — adds the local report ID column and unique key.

## How to test locally

1. Start the local PHP API on port `8000`.
2. Start the frontend on port `5000`.
3. Sign in as a student.
4. Wait for the online login to complete so the driver/category snapshot is downloaded.
5. Open browser DevTools and enable **Network > Offline**, or disable Wi-Fi temporarily.
6. Open **Submit report**. The cached drivers and categories should still be available.
7. Submit a report and allow location permission.
8. Confirm that the report is shown as saved offline and appears under **Pending reports**.
9. Confirm that latitude and longitude are shown in the saved report data or browser IndexedDB storage.
10. Re-enable the network.
11. Wait for the automatic retry, or press **Sync pending reports**.
12. Confirm the report appears in **My reports** and only one copy exists in MySQL.

## Important limitations

- Offline data is stored only on that browser/device until synchronization succeeds.
- A student must first sign in online at least once so the driver/category data can be downloaded.
- Clearing browser site data can remove unsynchronized reports.
- The browser must be opened again to perform synchronization; this is not yet a native background service.
- A browser cannot guarantee GPS availability. The user must grant permission and the device must provide a location estimate.
- File attachment storage depends on the browser's available IndexedDB quota.
- Emergency SOS and live SOS tracking remain disabled and marked as under development.

## Current implementation status

| Area | Status |
|---|---|
| Save report while offline | Implemented locally |
| Cache account data after online student login | Implemented locally |
| Login preparation/loading screen | Implemented locally |
| Use cached drivers and categories offline | Implemented locally |
| View cached reports and notifications offline | Implemented locally |
| Save latitude and longitude offline | Implemented locally |
| Save location accuracy and capture time | Implemented locally |
| Pending reports screen | Implemented locally |
| Automatic retry when online | Implemented locally |
| Manual retry button | Implemented locally |
| Failed-upload retry count | Implemented locally |
| Duplicate-upload protection | Implemented locally |
| Supabase/Vercel deployment | Not changed |
| Background sync while the app is closed | Not implemented |
| Offline map tiles/address lookup | Not implemented |
| SOS offline operation | Disabled / under development |
