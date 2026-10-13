# System Defense Reviewer

## Tricycle Drivers Conduct Reporting System

**Audience:** students, panel members, and community reviewers who may not have an IT background  
**Purpose:** explain the system, demonstrate its main workflow, and point reviewers to the source files that implement it.

---

## 1. The system in one minute

The Tricycle Drivers Conduct Reporting System gives students a place to report a concern about a tricycle trip. The report identifies the driver and vehicle, describes what happened, and can include a location and supporting files. Authorized staff can review the report, record actions, update its status, and leave a history that the student can follow. Drivers can see information connected to their own profile and reports.

The system is meant to organize information and make follow-up easier. **A submitted report is an allegation to review; it is not automatically proof that a driver committed a violation.** Authorized staff record a violation separately after reviewing the case.

### Short presentation introduction

> “Our project is a web-based reporting and follow-up system for tricycle conduct concerns. Students can submit and track reports, while authorized staff review them and record decisions. Driver and staff accounts see pages appropriate to their roles. The system keeps report details and review history together so the process is easier to follow.”

---

## 2. What problem does it address?

When concerns are reported through informal conversations or scattered messages, it can be difficult to keep the incident details, evidence, responsible driver, and follow-up in one place. This system provides a shared process to:

- collect the same basic information for each report;
- identify the driver and tricycle involved;
- send reports to an authorized review workflow;
- keep status changes, staff actions, and notifications connected to the report; and
- let the reporter check progress.

The system supports the people doing the review. It does not replace an investigation, make legal findings, or decide guilt automatically.

---

## 3. Who uses the system?

| Account type | Plain-language purpose |
| --- | --- |
| **Student** | Registers or signs in, submits a report, and follows reports and notifications associated with the account. |
| **Driver** | Views the driver profile and reports or violations associated with that driver. |
| **TODA President** | Manages or reviews information within the TODA scope assigned to the account. The API limits this role’s report and driver access by TODA. |
| **Authorized Personnel** | Reviews reports and records actions or status updates. |
| **PNP** | A separate account role in the API. It is allowed to use designated staff review endpoints and is presented within the staff workflow. |
| **Superadmin** | Performs higher-level account and system administration. This role should be reserved for trusted administrators. |

The server checks a person’s role when protected actions are requested. Hiding a button in the user interface is not the security boundary; the API also checks permission.

---

## 4. How one report moves through the system

1. **Sign in:** The user signs in, and the system checks the account and password.
2. **Choose the driver:** The student selects a registered driver or vehicle from the available list.
3. **Describe the incident:** The student gives the date, time, location, category, and a description. The form requires key details and asks the student to confirm the report is accurate to the best of their knowledge.
4. **Add evidence if available:** The student can attach supported images or a PDF. Location coordinates can also be included when available and permitted by the device.
5. **Submit or save offline:** With a working connection, the report is sent to the API and saved in the database. If offline, it can be saved on the device and submitted later after synchronization.
6. **Review:** Authorized staff open the correct report, review the information, and record actions or a status change.
7. **Follow-up:** The report’s history and notifications help the reporter see that an update has happened.
8. **Resolution:** Staff may resolve or close the report. If a violation is confirmed, that is recorded as a separate review outcome.

### Report statuses in everyday language

| System status | Meaning |
| --- | --- |
| `SUBMITTED` | The report was sent by the reporter. |
| `RECEIVED` | The report entered the review process. |
| `UNDER_REVIEW` | Staff are assessing the information. |
| `VERIFIED` | Staff recorded that the reported finding was verified. |
| `REFERRED` | The matter was referred for coordination or additional handling. |
| `RESOLVED` | Staff recorded that the review reached a resolution. |
| `CLOSED` | The case is closed and no further status changes are allowed. |

The API restricts which status changes may follow another status. It also saves a status-history record with the prior status, new status, user, remarks, and time.

---

## 5. How the parts fit together

Think of the system as three connected parts:

1. **The web pages** are what users see and interact with. They collect form entries, show dashboards, and display report updates.
2. **The API** is the server-side gatekeeper. It checks sign-in, permissions, required information, and allowed report changes before responding.
3. **The database and private file storage** keep the accounts, reports, review records, notifications, and evidence files.

For the documented local setup, the pages use **React and TypeScript**, served during development by **Vite**. The main local API is **PHP 8**, and the local database is **MySQL**. The browser sends requests to the API; the API reads or updates the database and returns a response for the page to display.

```text
Student / Driver / Staff
          |
          v
 React pages in the browser
          |
          v
 PHP API: sign-in, permissions, report rules
       /              \
      v                v
 MySQL database    Private evidence files
```

---

## 6. Code review map: where to look and why

Start with the **main API** and the **report form/review screen** to understand the main system workflow. The `api-php/index.php` file contains the main server-side request handling and business rules.

| Feature to review | File(s) | What the code does |
| --- | --- | --- |
| Main screen selection | `artifacts/mockup-sandbox/src/App.tsx` | Chooses which application screen to show for the current preview URL. |
| Login and registration page | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/Auth.tsx` | Collects sign-in or registration details and sends them to the API. |
| Shared API connection | `artifacts/mockup-sandbox/src/lib/api.ts` | Adds the sign-in token to requests, sends requests to the configured API, and handles API errors. |
| Student dashboard | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/StudentDashboard.tsx` | Loads the signed-in student’s report and notification summaries. |
| Report submission | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/SubmitReport.tsx` | Collects driver, incident, location, description, and optional evidence; checks required information; submits or saves a draft offline. |
| Student report list | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/MyReports.tsx` | Displays the student’s submitted reports and their current status. |
| Staff report queue | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/ReportsQueue.tsx` | Presents reports for authorized review and links a selected report to its detail view. |
| Review and decision workspace | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/ReviewWorkspace.tsx` | Loads a selected report, shows its evidence/history, and sends staff actions or status changes to the API. |
| Staff dashboard | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/OfficerDashboard.tsx` | Shows staff-oriented report summaries and account/TODA management screens. |
| Administrator dashboard | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/AdminDashboard.tsx` | Shows administrator-facing summaries and user-management tools. |
| Driver dashboard | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/DriverDashboard.tsx` | Loads driver profile information and gives the driver access to relevant pages. |
| Notifications | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/Notifications.tsx` | Displays account notifications and report-related updates. |
| Shared navigation and page frame | `artifacts/mockup-sandbox/src/components/mockups/tricycle-reporting/_shared/AppLayout.tsx` | Provides the common page layout, navigation, and offline report synchronization trigger. |
| Main server/API logic | `api-php/index.php` | Connects to the database, checks sessions and roles, handles report/account routes, validates uploads, and writes review history. |
| Local request routing | `api-php/router.php` | Sends local PHP server requests to the API entry point and blocks direct access to private files. |
| Safe local database setup | `api-php/setup-db.php` | Initializes a missing or empty local MySQL database; leaves a database with existing tables unchanged. |
| Database structure | `api-php/schema.mysql.sql` | Defines the MySQL tables and their relationships. **This schema includes `DROP TABLE` statements for a manual reset; do not import it over valuable data.** |
| Demo/reference data | `api-php/seed.mysql.sql` | Adds the starter local administrator, a sample TODA, and report categories. |
| Report drafts saved offline | `artifacts/mockup-sandbox/src/lib/offlineReports.ts` | Saves pending reports in browser storage and sends them to the API when synchronization is triggered. |
| Student offline data cache | `artifacts/mockup-sandbox/src/lib/offlineAccount.ts` | Saves student profile, driver/category lists, reports, and notifications locally for supported offline use. |
| Local development launcher | `scripts/dev.mjs` | Checks required PHP extensions, runs safe local database setup, and starts the PHP API and frontend. |
| Project setup instructions | `README.md` | Documents dependencies, local database setup, configuration, URLs, and troubleshooting. |

### A simple code walkthrough

Use this order when the panel asks where a feature is implemented:

1. Open `SubmitReport.tsx` to show what the student enters and where form checks happen.
2. Open `lib/api.ts` to show how the page sends the information to the server.
3. Open `api-php/index.php` and find the `POST /complaints` route to show server-side validation and saving.
4. Open `schema.mysql.sql` and find the `complaints` and `complaint_attachments` tables to show where report data is stored.
5. Open `ReviewWorkspace.tsx` and then the complaint status/action routes in `api-php/index.php` to show the staff follow-up.
6. Open `complaint_status_history`, `complaint_actions`, `notifications`, and `audit_logs` in the schema to show how updates are recorded and communicated.

---

## 7. What the database keeps

The database separates different kinds of information so related records can be linked and reviewed:

- **Accounts and roles:** `users`, `students`, `drivers`, and `authorized_personnel`.
- **Organizations and lookup lists:** `todas` and `complaint_categories`.
- **Report details:** `complaints` and `complaint_attachments`.
- **Review history:** `complaint_status_history`, `complaint_actions`, and `violations`.
- **Communication and accountability:** `notifications` and `audit_logs`.
- **User settings and emergency feature records:** `user_preferences` and `sos_alerts`.

For example, a complaint points to the driver and category involved. Status-history entries point back to the complaint and, when available, the account that made the change. This lets reviewers follow a report over time instead of replacing its history with only the latest status.

---

## 8. Protection and fairness explained simply

- **Passwords are not stored as readable text.** The PHP API saves a password hash and checks a submitted password against that hash at sign-in.
- **A sign-in token proves the user has an active session.** The API signs the token, checks its signature and expiry, and then checks that the account is still active.
- **The server checks the account role.** A student cannot gain staff access just by changing a page address or button in the browser.
- **TODA presidents have a narrower view.** Their report access is limited to reports involving drivers within their assigned active TODA.
- **Database inputs use prepared statements.** The API binds submitted values separately from the SQL instruction.
- **Evidence uploads have limits.** The API accepts a restricted set of file types, checks the file’s actual content type, limits the number and size of files, and stores them outside the public API directory.
- **Review changes leave a history.** The API saves who changed a report, what changed, and the remarks where provided.

For a real deployment, the project notes call for HTTPS, a unique secret key, a restricted list of allowed website origins, protected database credentials, private upload storage, and role-based testing. These are deployment requirements; a successful local demo alone does not prove production security.

---

## 9. Offline use

The report form can save a report draft in the browser’s local storage when the device has no connection. The student must first connect while online so the app can download the official driver and category lists. The pending report stays on that device until synchronization is run with a connection. A local “saved offline” reference means **saved on the device**, not yet received by the review team.

The pending reports screen provides a way to retry synchronization. A successful upload is removed from the local queue; a failed upload remains with its error and retry information. Offline support is limited to the implemented student/report workflow—it does not mean the whole system or its staff review process works without a server connection.

---

## 10. Important current limits: explain these honestly

1. **Emergency SOS is not enabled in the current API.** `api-php/index.php` sets `SOS_ENABLED` to `false`; requests to the SOS routes return an “under development” response. Database tables and screens do not mean the live emergency service is ready. Do not demonstrate it as a functioning emergency service.
2. **Some review screens contain sample fallback information.** `ReviewWorkspace.tsx` initializes illustrative example details and replaces them when it loads a matching live report. A defense demo should use a real test report and show its actual reference. If the API cannot load it, clearly label the screen as sample content.
3. **Offline reports have not reached staff until synchronization succeeds.** Explain the difference between a device-saved draft and a server-received report.
4. **A build or code check is not the same as full system testing.** The existing system review recommends controlled staging and real browser/database testing for each role before public production use. The project currently has no automated test files configured.
5. **The MySQL schema can reset tables when run manually.** `schema.mysql.sql` contains table-drop statements. The normal local bootstrap avoids resetting a non-empty database; do not manually re-import the reset schema into a database containing data you need.
6. **The sample local administrator is for development.** Do not use starter credentials or real personal information in a public deployment. Configure new credentials and use test records for demonstrations.
7. **Do not promise email-based password recovery without verifying it.** The project review notes say the forgot-password interface exists, but a complete production password-reset service still needs confirmation.

If asked whether the system is production-ready, a safe accurate answer is:

> “The current project is prepared for controlled staging and demonstration. Before public production use, we still need complete testing with real database setup and role-specific accounts, review deployment security settings, and confirm that features such as emergency SOS are enabled and tested.”

---

## 11. Suggested five-minute demonstration

Use test accounts and test data. Confirm the API and database are running before the panel arrives.

### Before the panel arrives

1. Start MySQL and confirm the local PHP configuration points to the intended test database.
2. From the project folder, run `npm run dev`. The local launcher checks PHP database/file upload extensions, safely prepares a new or empty local database, and starts the PHP API and frontend.
3. Open the frontend at `http://localhost:5000/`.
4. If the pages cannot load data, check the API at `http://localhost:8000/index.php/healthz` and confirm that the local account and test records exist.
5. Sign in with prepared test accounts for Student and Authorized Personnel. Have a test driver and a sample report ready. Do not display real personal details or starter credentials to the panel.

1. **Introduce the goal:** Explain that the system organizes reporting and follow-up; it does not automatically decide that a violation occurred.
2. **Sign in as a student:** Show the student page and the report submission steps.
3. **Submit a safe sample report:** Use a test driver and invented incident details. Show the confirmation reference. If submitting offline, explicitly show that it is saved locally and not yet delivered.
4. **Sign in as authorized personnel:** Open the same report by its reference. Show its details and status history.
5. **Record a review update:** Make one valid status change or action note and show it in the report history.
6. **Explain access control:** Show that student, driver, and staff accounts have different workspaces and that the API enforces those roles.
7. **Close with limitations:** State clearly that SOS is disabled in the current API and that public production deployment still needs staging checks.

If time is short, show one complete student-to-staff report flow rather than opening every dashboard.

---

## 12. Likely panel questions and simple answers

### “What is the main purpose of your system?”

It provides one organized way for students to report tricycle conduct concerns and for authorized staff to review and track those concerns.

### “How do you make sure a report is fair?”

The report is treated as information for review, not an automatic finding. Staff review its details and evidence, record actions, and move it through allowed statuses. A confirmed violation is stored separately from the original report.

### “How does the system protect information?”

The API checks that a user is signed in and that the user’s role permits the requested action. Passwords are hashed, report and account data are accessed through prepared database queries, and evidence files are kept in private storage. Deployment settings such as HTTPS and secret management must also be configured before production.

### “What happens if the student loses internet?”

The student can save a report draft locally if the official driver and category data were downloaded earlier. The draft must be synchronized after the connection returns. Until that upload succeeds, staff cannot see it.

### “How do you prevent duplicate offline reports?”

Each offline draft has a unique local report ID. The API checks that ID for the same student before creating another copy when the client retries.

### “What happens after a report is submitted?”

It is saved with a reference number and a starting status. Authorized staff can review it, add a note or status change, and the system records the change in history and can send notifications.

### “Can any staff member see every report?”

Permissions depend on the role. For example, the API scopes a TODA president’s reports to drivers in the active TODA assigned to that president. Authorized Personnel, Superadmin, and PNP have broader review routes.

### “Is the SOS function ready?”

No. The current API explicitly disables the SOS routes. It must be completed, configured, and tested before anyone relies on it in an emergency.

### “What technologies did you use?”

The documented local version uses React and TypeScript for the pages, PHP for the API, and MySQL for the database. Vite runs the frontend during development.

### “What should be done next?”

Run a controlled staging test with a real database and test accounts for each role, verify access restrictions and report updates, review production security settings, and complete and test the SOS feature before public launch.

---

## 13. Plain-language glossary

| Word | Meaning |
| --- | --- |
| **API** | The server-side part of the system that receives requests and applies the rules. |
| **Backend** | The part users do not see directly; it checks permissions and handles saved information. |
| **Frontend** | The pages and controls people see in the browser. |
| **Database** | Organized digital storage for accounts, reports, and review history. |
| **Role** | The account type that determines which actions a user is allowed to perform. |
| **TODA** | The tricycle operators and drivers association connected with a driver or route. |
| **Status history** | A dated list of report progress changes. |
| **Audit log** | A record of important actions for later review. |
| **Offline draft** | A report saved on one device but not yet received by the server. |
| **Staging** | A private test installation used before a system is opened to the public. |
| **Production** | The live system used for real operations. |
