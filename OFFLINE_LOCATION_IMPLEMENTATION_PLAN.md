# Online and Offline Location Implementation Plan

## Phase 1: Database

Add these fields to the `complaints` table:

```text
latitude
longitude
location_accuracy_meters
location_captured_at
```

Offline-only fields should be stored on the device:

```text
local_report_id
sync_status
saved_at
retry_count
```

Offline records should not be stored permanently on the server until they are submitted.

## Phase 2: Online Location Capture

In the student report form:

1. Add a **Use my current location** button.
2. Request location permission from the phone.
3. Capture latitude, longitude, accuracy, and timestamp.
4. Display a confirmation, for example:

   ```text
   Location captured, accuracy ±18 meters
   ```

5. Send the coordinates with the complaint.
6. Save the coordinates in Supabase.
7. Show authorized reviewers a map link.

If permission is denied, allow the student to enter the location manually.

## Phase 3: Offline Report Saving

When the phone has no internet:

1. The student fills out the report.
2. The app captures the GPS location.
3. The app saves the report in IndexedDB.
4. The app displays:

   ```text
   Report saved on this device. It will be submitted when you reconnect.
   ```

Store the following in IndexedDB:

- Report fields
- Coordinates
- Location accuracy
- Capture time
- Attachments
- Local report ID
- Synchronization status

Use IndexedDB instead of `localStorage` because reports and attachments may be large.

## Phase 4: Synchronization

When the connection returns:

1. Detect the connection.
2. Check the offline report queue.
3. Upload one report at a time.
4. Upload attachments.
5. Mark successful reports as `Submitted`.
6. Remove successfully uploaded records from IndexedDB.
7. Keep failed records and provide a **Retry** action.
8. Prevent duplicate submissions using the local report ID.

Use these synchronization statuses:

```text
Draft
Saved offline
Uploading
Submitted
Upload failed
```

## Phase 5: API Support

Update the complaint API to:

- Accept optional coordinates.
- Validate latitude and longitude.
- Validate location accuracy.
- Accept an offline client ID.
- Reject duplicate client IDs.
- Save the original location-capture timestamp.
- Return the official complaint reference number.

The server should preserve the capture timestamp but should not treat GPS as perfectly exact.

## Phase 6: Student Interface

Add:

- Location capture button.
- Location accuracy indicator.
- Online/offline status indicator.
- Pending reports screen.
- Retry upload button.
- Submitted confirmation.
- Manual location fallback.
- Privacy explanation.

Suggested privacy message:

> Your location is captured only for this report and is not continuously tracked.

## Phase 7: Reviewer Interface

For authorized personnel:

- Show whether a report has GPS data.
- Show the coordinates and accuracy.
- Add an **Open map** button.
- Display the capture time.
- Label GPS location as submitted evidence, not automatic proof of the incident.

Example map link:

```text
https://www.google.com/maps?q=LATITUDE,LONGITUDE
```

## Phase 8: Authorized Personnel Map View

The Authorized Personnel dashboard should include a map view for reports that contain GPS coordinates.

The map view should:

- Display a marker for the report location.
- Show the complaint reference number.
- Show the incident date and time.
- Show the GPS accuracy in meters.
- Show when the location was captured.
- Provide an **Open in Google Maps** action.
- Display a clear message when no GPS location was captured.

Access rules:

- Students can view the location attached to their own reports.
- Authorized Personnel can view report locations within their assigned access scope.
- Super Admin and PNP reviewers can view locations according to their existing permissions.
- Drivers should not automatically receive the student's exact location unless this is explicitly approved by the system policy.

Privacy and safety requirements:

- Do not show a live student location.
- Show only the location captured with the submitted report.
- Do not expose coordinates in public URLs or unauthenticated pages.
- Keep the location marker labeled as submitted evidence, not proof that an incident occurred there.
- Use a visible accuracy circle or accuracy label when the map supports it.

Recommended implementation options:

1. Start with an **Open in Google Maps** link using the saved coordinates.
2. Add an embedded map later using a provider such as Google Maps, Mapbox, or OpenStreetMap.
3. Avoid requiring a paid map service for the first release unless an embedded map is necessary.

## Phase 9: Testing

Test these scenarios:

- Online submission with GPS.
- Online submission without permission.
- Offline submission with GPS.
- Offline submission without GPS.
- Reconnection and automatic upload.
- Failed upload and retry.
- Duplicate prevention.
- Large attachments saved offline.
- Browser closed before reconnection.
- Poor GPS accuracy.
- Student cancels location permission.

## Recommended First Release

Start with:

1. Online GPS capture.
2. Manual location fallback.
3. Offline report storage.
4. A manual **Sync pending reports** button.
5. Automatic synchronization when the app is reopened online.

Add full background synchronization later because mobile browsers cannot always run reliably after being completely closed.

## Offline Implementation Details

The offline feature should be added on top of the existing online report form.

### 1. Detect Connection Status

Add an online/offline indicator using browser connection events:

```js
window.addEventListener("online", syncPendingReports);
window.addEventListener("offline", showOfflineStatus);
```

Display clear states such as:

```text
Online
Offline — reports will be saved on this device
```

### 2. Store Reports Locally

When a student submits while offline:

- Capture latitude and longitude.
- Save the report in IndexedDB.
- Save attachments in IndexedDB.
- Assign a local report ID.
- Mark the report as `Saved offline`.

The app should not send the report to the API while there is no connection.

### 3. Pending Reports Screen

Students should be able to view pending reports with:

- Report date
- Location
- GPS coordinates
- Attachment count
- Retry button
- Delete draft button

Example message:

```text
Report saved offline
Waiting for connection
```

### 4. Synchronize When Online

When the connection returns:

1. Read pending reports from IndexedDB.
2. Upload each report to the existing API.
3. Upload attachments.
4. Mark successful reports as `Submitted`.
5. Remove successfully uploaded reports from local storage.
6. Keep failed reports for retry.

Use these synchronization states:

```text
Saved offline
Uploading
Submitted
Upload failed
```

### 5. Prevent Duplicate Reports

Every offline report needs a `localReportId`.

The API should accept this ID and reject it if the same report was already uploaded. This prevents duplicate complaints when the connection drops during upload.

### 6. Add a Service Worker

The service worker should cache:

- Application shell
- Report pages
- CSS and JavaScript
- Icons and static assets

It should not cache private API responses or sensitive student reports.

### 7. Offline Limitations

Offline mode can:

- Capture GPS coordinates.
- Save the report.
- Save attachments.
- Upload the report later.

Offline mode cannot:

- Contact authorized personnel immediately.
- Send notifications.
- Show fresh driver data.
- Guarantee background upload after the browser is fully closed.

The first offline version should include a visible **Sync pending reports** button. Automatic synchronization can be added later.

### 8. Recommended Offline Build Order

1. Add IndexedDB storage.
2. Save text reports offline.
3. Add GPS data to offline reports.
4. Add attachment storage.
5. Add upload synchronization.
6. Add duplicate protection.
7. Add service-worker caching.
8. Test airplane mode, reconnection, failed uploads, and duplicate prevention.
