# Local SOS Emergency Tracking Plan

This plan describes the local-only SOS prototype. It uses the local PHP API and MySQL database. It does not modify Supabase, the online Node API, or Vercel.

## SOS Student Flow

1. The student opens **Emergency SOS**.
2. The student selects the driver or tricycle connected to the current trip.
3. The student presses **Press to send SOS**.
4. The browser requests location permission.
5. The app captures the first GPS position.
6. The app creates an active SOS alert.
7. The app continues sending GPS updates while the alert is active.
8. The student can cancel the alert.
9. Authorized Personnel can resolve the alert.

The student is not tracked before SOS is activated.

## Database

Create the local `sos_alerts` table using:

```text
api-php/migrations/004-sos-alerts.sql
```

The table stores:

- SOS alert ID
- Student account
- Selected driver
- Alert status
- Latitude
- Longitude
- GPS accuracy
- Start time
- Last GPS update time
- Resolution time
- Resolving Authorized Personnel account

Supported statuses:

```text
ACTIVE
RESOLVED
CANCELLED
```

## Local API Endpoints

### Start an SOS

```text
POST /sos
```

Requires a student account and accepts:

- `driverId`
- `latitude`
- `longitude`
- `accuracy`

Only one active SOS is allowed per student.

### Update Live Location

```text
PATCH /sos/{id}/location
```

Only the student who started the alert can update its location.

### View Active Alerts

```text
GET /sos/active
```

Available to:

- Authorized Personnel
- Super Admin
- PNP reviewers

### Cancel an SOS

```text
POST /sos/{id}/cancel
```

Only the student who started the alert can cancel it.

### Resolve an SOS

```text
POST /sos/{id}/resolve
```

Available to Authorized Personnel, Super Admin, and PNP reviewers.

## Live GPS Updates

Use the browser Geolocation API:

```js
navigator.geolocation.watchPosition(...)
```

While the SOS is active:

- Send the latest latitude and longitude to the local API.
- Save the latest GPS accuracy.
- Update `last_seen_at`.
- Stop watching when the alert is cancelled or resolved.

If GPS updates fail, keep the SOS active and show a warning to the student.

## Authorized Personnel Monitor

The **Emergency SOS** monitor should:

- Poll `/sos/active` every three seconds.
- Display a list of active students.
- Show the selected driver and tricycle identifier.
- Show the latest latitude and longitude.
- Show GPS accuracy.
- Show a live map marker.
- Refresh the marker as new coordinates arrive.
- Provide a **Resolve SOS** button.
- Provide an **Open in Google Maps** link.

The local prototype uses an OpenStreetMap embedded map with a marker and a Google Maps link for external navigation.

## Emergency Alarm

When an active SOS appears:

- Show a red emergency banner.
- Display the number of active emergency alerts.
- Play a repeating alarm tone.
- Vibrate the device when supported.
- Continue the alarm while at least one SOS is active.
- Stop the alarm when no active SOS remains.

The local alarm repeats approximately every 900 milliseconds and uses increased browser audio gain.

### Browser Audio Limitation

Browsers may block automatic audio until the Authorized Personnel user interacts with the page. The monitor should remain visually active even if audio is blocked. A user click on the monitor page can allow the audio context to resume.

## Security and Privacy

- Do not track students before SOS activation.
- Do not expose active SOS data to students other than the alert owner.
- Restrict active-alert access to authorized roles.
- Stop location updates after cancellation or resolution.
- Do not expose coordinates in public pages.
- Keep an audit record for starting, cancelling, and resolving SOS alerts.
- Treat GPS data as sensitive information.

## Local Testing Checklist

### Student

- Select a driver.
- Start SOS with location permission enabled.
- Confirm the alert becomes active.
- Confirm GPS updates continue.
- Confirm the student can cancel the alert.
- Test denied location permission.
- Test starting a second SOS while one is already active.

### Authorized Personnel

- Open the Emergency SOS monitor.
- Confirm the red emergency banner appears.
- Confirm the repeating alarm starts.
- Confirm vibration works when supported.
- Confirm the student and driver details appear.
- Confirm the live map marker appears.
- Confirm coordinates and accuracy are displayed.
- Confirm the marker updates after the student moves.
- Resolve the alert.
- Confirm the alarm stops.

### Database and API

- Run `004-sos-alerts.sql` locally.
- Confirm `GET /api/healthz` remains healthy.
- Confirm unauthorized roles cannot view active alerts.
- Confirm one active SOS per student.
- Confirm resolved alerts no longer appear in `/sos/active`.

## Current Local Scope

The current prototype uses local PHP/MySQL and polling. It is not deployed online. A production version should later consider WebSockets or Supabase Realtime, stronger emergency escalation, official responder integration, and a defined location-data retention policy.
