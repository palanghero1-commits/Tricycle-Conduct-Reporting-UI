# QA Report — Tricycle Conduct Reporting UI

Date: 2026-10-09  
Scope: React/Vite frontend, PHP API, build pipeline, and static data-flow review.

## Executive summary

The original audit identified eight runtime and data-flow defects. All eight have now been fixed in the working tree. Automated test coverage is still absent, so the fixes were verified through type-checking, PHP syntax validation, production compilation, and targeted source inspection.

## Post-fix verification — 2026-10-09

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `php -l api-php/index.php` | PASS |
| `npm run build` | PASS; frontend and API bundles generated |
| `npm test` | EXPECTED FAILURE: no test files exist; Vitest exits with code 1 |
| Mojibake scan in frontend source | PASS; corrupted UTF-8 marker sequences removed |

Implemented fixes:

- Moved `ReviewWorkspace` status `useMemo` before the conditional return.
- Passed the selected report reference into the review route and used it for the complaint lookup.
- Added client-side location and minimum-description validation before the final submission step.
- Changed report date filters to calculate from the current date.
- Removed the driver route to `StudentDashboard`; it now opens the driver profile destination.
- Added a PNP reviewer option to the personnel login selector.
- Replaced corrupted character sequences in the frontend source.
- Returned and displayed the actual review-history actor name/role from the API.
- Changed the app shell so the desktop sidebar stays fixed while only the main content area scrolls.

## Verification results

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `php -l api-php/index.php` | PASS |
| `npm run build` | PASS; frontend and API bundles generated |
| `npm test` | FAIL/NOT CONFIGURED: Vitest reports no test files and exits with code 1 |
| Lint | NOT AVAILABLE: no lint script is defined in `package.json` |

## Original findings and resolution status

### QA-001 — ReviewWorkspace violates the Rules of Hooks — FIXED

Severity: High  
File: `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/ReviewWorkspace.tsx:235-245`

`useMemo` is declared after an early return. On the initial render, `incident` and `driver` are null and the component returns before calling `useMemo`. After the API response populates those values, the same component calls the hook, changing the hook order between renders. React can fail with “Rendered more hooks than during the previous render.”

Reproduction: open the review workspace while authenticated, then allow `/complaints` and `/complaints/{id}` to resolve with a record.

Recommended fix: move `latestStatusCopy` above the early return or replace it with a normal expression/function.

### QA-002 — ReviewWorkspace always opens the first complaint — FIXED

Severity: High  
File: `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/ReviewWorkspace.tsx:197-202`

The workspace requests `/complaints`, then unconditionally uses `complaints[0]`. There is no selected complaint ID from the queue, URL, or navigation state. When multiple reports exist, opening a specific report can display and mutate a different report.

Recommended fix: pass the selected complaint ID through navigation/query state and request that ID; only fall back to the first record when no selection exists.

### QA-003 — Submit report allows invalid final submission data — FIXED

Severity: High  
File: `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/SubmitReport.tsx:257-267`

The step navigation validates only the driver, incident date, and incident time. It does not validate location or description before reaching the final step. The PHP API requires both fields and rejects descriptions shorter than 15 characters (`api-php/index.php:639-645`). Users can therefore reach “Send report” and receive a server error instead of an inline validation message.

Recommended fix: validate location, category/“Other” category, and a trimmed description of at least 15 characters before advancing from step 2 or before submission.

### QA-004 — My Reports date filters use a frozen date — FIXED

Severity: Medium  
File: `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/MyReports.tsx:316-324`

The “Last 30 days” and “Last 90 days” filters calculate their cutoff from `new Date("2026-02-24T00:00:00")`. As time advances, valid current reports are excluded and old reports can remain included. The report was checked on 2026-10-09, making this behavior incorrect now.

Recommended fix: calculate `now` at evaluation time, using the application’s Philippine-date helper if date boundaries must be local to the user.

### QA-005 — Driver Dashboard routes to StudentDashboard — FIXED

Severity: Medium  
File: `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/_shared/AppLayout.tsx:77-83`

The driver navigation maps “Dashboard” to `StudentDashboard`. A driver who signs in is therefore sent to a student-oriented dashboard and may see student reporting actions or copy. The login flow itself routes drivers to `Profile`, but any driver dashboard navigation uses the wrong component.

Recommended fix: create/use a driver dashboard component or remove the dashboard item until a driver-specific destination exists.

### QA-006 — PNP accounts cannot use the normal personnel login selector — FIXED

Severity: Medium  
File: `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/Auth.tsx:26,231-236`

The personnel selector only supports `AUTHORIZED_PERSONNEL` and `TODA_PRESIDENT`. A valid PNP account returned by the API has role `PNP`, but the selected expected role can never be `PNP`; the UI clears the token and reports a role mismatch after successful authentication.

Recommended fix: add PNP to the personnel role selector, or treat PNP as a supported personnel login role without requiring the user to select an unavailable role.

### QA-007 — Character encoding is visibly corrupted — FIXED

Severity: Medium  
Examples: `Auth.tsx:46`, `SubmitReport.tsx:235-241`, and multiple UI strings contain `Â`, `Ã`, or `â` sequences.

These strings will render incorrectly in the interface, including separators, ellipses, and plus/minus symbols.

Recommended fix: save affected source files as UTF-8 and replace mojibake text with the intended Unicode characters or ASCII equivalents.

### QA-008 — Review history uses generic actor data — FIXED

Severity: Low/Medium  
File: `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/ReviewWorkspace.tsx:229-230`

Live history entries are mapped to the hardcoded actor name `Authorized reviewer` and tone `blue`, even though the API returns history records. This misrepresents who performed an action and reduces audit accuracy.

Recommended fix: return/map the actual actor name and role from the API and use the actual action/status metadata.

## Coverage and testability risks

- `npm test` has no test files, so critical authentication, permissions, offline storage, complaint submission, and review flows have no automated regression protection.
- No lint command is configured.
- The UI contains unused static report data in `MyReports.tsx:39-100`; the component renders `liveRecords`, so the static records are not used as a meaningful fallback when the API fails.
- A browser-level smoke test against a running API/database was not possible from the repository-only audit because no configured database credentials or running PHP/MySQL service were provided.

## Previously reported items rechecked

The following earlier reports appear fixed in the current source:

- `POST /seed` now authenticates and requires `SUPERADMIN` (`api-php/index.php:855-860`).
- Complaint access checks now enforce student ownership, driver ownership, and TODA-president assignment (`api-php/index.php:904-929`).
- The mobile navigation button now opens the mobile navigation drawer (`AppLayout.tsx:290`).
- Driver account creation no longer silently defaults to TODA 1; it requires a valid active TODA (`api-php/index.php:374-383`).

## Suggested priority

1. Fix QA-001 and QA-002 because they can make the review workflow crash or operate on the wrong complaint.
2. Fix QA-003 and QA-006 because they block or degrade core submission/login flows.
3. Fix QA-004, QA-005, QA-007, and QA-008.
4. Add browser/API integration tests and at least a minimal unit test suite before the next release.
