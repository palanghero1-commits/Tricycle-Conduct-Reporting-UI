# Tricycle Conduct Reporting System

## Overall System Review

**Review date:** October 9, 2026  
**Review type:** Pre-staging software review  
**Audience:** Project owner, staff, testers, and non-technical users  
**System status:** Suitable for controlled staging testing after the local PHP/database setup is completed. It is not yet certified for public production use.

---

## 1. Executive summary

The Tricycle Conduct Reporting System is a web application for reporting, reviewing, and tracking tricycle-related conduct concerns.

The system now separates the experience for students, drivers, authorized personnel, TODA presidents, and administrators. Users are sent to the correct workspace after login, and each role has its own available pages and actions.

The main issues previously found during review have been addressed, including the review-page crash, opening the wrong complaint, incomplete report validation, incorrect date filtering, incorrect driver routing, the PNP role mismatch, corrupted text, and generic review-history information.

Additional improvements were also made:

- The sidebar stays fixed while the main page content scrolls.
- The driver selector in the report form is now a type-to-search field.
- Notifications are accessed from the bell in the top bar instead of appearing as a duplicate sidebar item.
- Notification clicks open the relevant notification subject.
- Driver details include information needed for emergency contact tracing.
- The old “PNP reviewer” wording was replaced with “Authorized Personnel.”
- The large sign-out card was removed from the profile page.

The application builds successfully and the PHP API passes syntax checking. The most important remaining checks must be completed in the staging environment with a real database, real browser sessions, and test accounts for every role.

---

## 2. What the system does

In everyday language, the system follows this process:

1. A student signs in.
2. The student identifies the driver or tricycle involved in an incident.
3. The student describes what happened and can attach supporting evidence.
4. The report is saved in the system.
5. Authorized personnel review the report.
6. The report receives an appropriate status or review action.
7. The student can view updates and notifications.
8. Drivers can view their own driver information, reports, and violations.
9. Emergency information can be used to identify and contact the driver when an SOS event occurs.

The system is intended to support fair review. Submitting a report does not automatically mean that a violation has been confirmed.

---

## 3. User roles and responsibilities

### Student

Students can:

- Open the student dashboard.
- Submit a conduct report.
- Select a driver by typing a name or vehicle identifier.
- Add incident details and optional evidence.
- View pending and submitted reports.
- View notifications and report updates.
- Use emergency SOS functions when available.
- Manage their own profile.

Students cannot open staff review pages or driver-management pages.

### Driver

Drivers can:

- Open the driver dashboard.
- View their own driver profile.
- View tricycle identifier, plate number, route, TODA, and contact information.
- View reports connected to their account.
- View violations connected to their account.
- View notifications and account settings.

Drivers are no longer shown a student workspace label. Their pages should consistently use driver wording, such as “Driver workspace” and “Driver dashboard.”

### Authorized Personnel

Authorized personnel can:

- Open the authorized personnel dashboard.
- Review submitted reports.
- Open a specific complaint by its reference number.
- Update review status and record review actions.
- View review history with the actual actor name and role when available.
- Manage or review drivers, violations, TODA information, and reports according to the account permissions.

PNP accounts are treated as authorized personnel in the user-facing system. The separate “PNP reviewer” identity and wording were removed because the required role is simply “Authorized Personnel.”

### TODA President

TODA presidents use the authorized personnel area, but their work is limited to the TODA-related information and reports allowed for their account. They should not automatically receive unrestricted system administration access.

### System Administrator

The administrator area is intended for system-level management, such as user, organization, configuration, and broader reporting functions. This role should be used only by trusted administrators.

---

## 4. Completed fixes

### Original QA findings

The following eight issues were previously confirmed and have been fixed:

1. **Review page crash** — The review page had a React hook-order problem that could crash the page. The hook logic was moved so it runs consistently on every render.
2. **Wrong complaint opened** — Review navigation now carries the selected complaint reference and loads that exact complaint instead of relying on an incorrect or missing selection.
3. **Invalid reports reaching submission** — The report flow now checks required information before allowing the user to continue or submit. This includes the selected driver, location, and a description with sufficient detail.
4. **Hardcoded date filter** — Date filtering now uses the current date instead of a fixed date from an earlier test scenario.
5. **Driver dashboard routing** — Drivers are routed to their own dashboard instead of the student dashboard.
6. **PNP login role mismatch** — PNP accounts are accepted and displayed as authorized personnel. The user-facing PNP reviewer role was removed.
7. **Corrupted character encoding** — Visible text containing broken characters was corrected across the affected frontend files.
8. **Generic review-history actor data** — Review history now requests actor information from the API and displays the available actor name and role instead of generic hardcoded values.

### Additional changes requested during the UI review

- **Role-specific routing:** Each role is directed to its own workspace after login.
- **Student-only dashboard:** The student dashboard redirects non-student users to the correct workspace.
- **Driver workspace:** A dedicated driver dashboard was added with driver-specific summary information and links.
- **Fixed sidebar:** The sidebar is outside the scrolling content area. The main content scrolls independently, so the sidebar does not become part of the page scroll.
- **Driver search:** The report form no longer depends on a closed dropdown. The user can type a driver name, vehicle identifier, or route area and choose from the matching results.
- **Notification behavior:** The duplicate notification sidebar item was removed. The bell remains in the top bar, and clicking a notification opens the notification page focused on the selected subject.
- **Profile cleanup:** The large profile sign-out card was removed. Sign out remains available from the main navigation.
- **Emergency contact details:** Driver and SOS responses now include driver code, tricycle identifier, plate number, route area, contact number, and TODA information where available.
- **Role wording:** Staff-facing PNP wording was replaced with “Authorized Personnel.”

---

## 5. Verification performed

The following checks were run against the current project:

- **Frontend type check:** Passed.
- **PHP syntax check:** Passed for `api-php/index.php`.
- **Frontend production build:** Passed.
- **API and frontend build process:** Previously passed during the review.
- **Automated test command:** No automated test files are currently configured. Running the test command reports that no test files were found.
- **Linting:** No lint command is currently configured in the project scripts.

### What the successful checks mean

The source code is valid enough to compile, and the PHP entry point has no syntax error. This is a good technical baseline for staging.

### What the checks do not prove

These checks do not prove that every screen works with real database records. They also do not prove that every role is correctly isolated in a browser, that the API can connect on another computer, or that the emergency workflow works in a real deployment.

For that reason, the current result should be described as:

> **Ready for controlled staging QA, pending environment setup and real-user scenario testing.**

---

## 6. Important setup issue: “could not find driver”

If another computer displays:

> Database request failed: could not find driver

the application code is usually not the direct cause. It means that PHP on that computer does not have the database connection extension enabled.

For a MySQL database, the other computer needs the PHP `pdo_mysql` extension. For PostgreSQL, it needs `pdo_pgsql` instead.

The person preparing staging should:

1. Run `php --ini` to find the active PHP configuration file.
2. Open that `php.ini` file.
3. Enable the correct PDO database extension, usually by removing the semicolon before `extension=pdo_mysql`.
4. Confirm the extension with:

   ```powershell
   php -m | findstr /I "PDO mysql"
   ```

5. Confirm the available PHP database drivers with:

   ```powershell
   php -r "print_r(PDO::getAvailableDrivers());"
   ```

6. Restart the PHP development server after changing the configuration.

The project currently contains a local PHP configuration that points to a machine-specific PHP installation path. That path should not be copied blindly to another computer. Each staging computer must use its own PHP installation and its own active `php.ini`.

The database connection settings should be placed in the local ignored configuration file, such as `api-php/config.php`, rather than committed with passwords or machine-specific paths.

---

## 7. Staging test plan for non-technical testers

Use test accounts and test data. Do not use real personal information while testing.

### A. Login and routing

- Sign in as a student. Confirm that the student dashboard opens.
- Sign in as a driver. Confirm that the driver dashboard opens and no student workspace wording appears.
- Sign in as authorized personnel. Confirm that the staff dashboard and review tools open.
- Sign in as a TODA president. Confirm that the account opens the correct restricted staff workspace.
- Confirm that a user cannot open another role’s dashboard simply by typing its URL.
- Sign out and confirm that protected pages are no longer accessible without signing in again.

### B. Student report flow

- Open “Submit report.”
- Type part of a driver name and confirm that matching drivers appear.
- Type a vehicle identifier and confirm that matching records appear.
- Select a driver and confirm that the selected driver is visible.
- Try to continue without a driver. The system should stop the user and explain what is missing.
- Try to submit a very short description. The system should request more detail.
- Confirm that the location is required when the report flow requires it.
- Submit a valid test report.
- Confirm that the report appears in the student’s report history.

### C. Review flow

- Open the staff review queue.
- Open report A and confirm that report A’s details are shown.
- Return to the queue and open report B. Confirm that report B’s details are shown.
- Change the status of a test report.
- Confirm that the history shows the correct staff actor when actor data exists.
- Confirm that a student cannot see internal staff-only review actions.

### D. Notifications

- Confirm that the sidebar does not contain a second Notifications item.
- Click the top-bar bell.
- Select a notification about a test report.
- Confirm that the notification page opens the selected subject/report.
- Confirm that read/unread state behaves as expected.

### E. Driver and emergency information

- Open the driver profile.
- Confirm that driver code, tricycle identifier, plate number, route, TODA, and contact number are shown when stored.
- Trigger the test SOS process if it is enabled in the staging configuration.
- Confirm that authorized personnel can see enough driver information to identify and contact the driver.
- Confirm that unauthorized users cannot view unrelated drivers’ private contact information.

### F. Layout and usability

- Scroll a long page.
- Confirm that the main content scrolls while the sidebar stays fixed.
- Test the layout at desktop and mobile-sized browser widths.
- Confirm that buttons, search fields, and notification links remain usable.
- Check that no visible text contains broken characters.

---

## 8. Remaining risks and limitations

These items should be resolved or consciously accepted before production:

- **No automated test suite:** The project currently has no test files, so regressions must be checked manually.
- **No configured linting:** A lint command should be added before long-term maintenance if the team wants automatic style and quality checks.
- **Live database testing is still required:** The build can pass while the database connection, schema, permissions, or seed data are wrong.
- **Password reset is not fully confirmed:** The forgot-password interface exists, but a complete production password-reset service still needs to be verified.
- **Emergency SOS availability depends on configuration:** The current API contains an SOS enable/disable setting. Confirm that it is enabled and correctly secured in staging before relying on it.
- **Production security settings are required:** Use HTTPS, a unique JWT secret, a production CORS allow-list, secure database credentials, and protected upload directories.
- **Private configuration must stay private:** Do not commit database passwords, JWT secrets, `.env.online`, or machine-specific PHP paths.
- **Data privacy must be reviewed:** Driver contact and location details are sensitive. Production access should follow the minimum permissions needed by each role.

---

## 9. Recommended staging acceptance criteria

The system can be accepted for staging when all of the following are true:

- PHP can connect to the staging database using the required PDO driver.
- The database schema and required seed data are installed.
- Each role can log in and reaches the correct dashboard.
- Students cannot access staff or driver-only functions.
- Drivers see driver wording and driver-specific data.
- Authorized personnel can review the correct complaint.
- Invalid reports cannot be submitted.
- Driver search works by name and vehicle identifier.
- Notifications open the correct subject.
- SOS/contact-tracing information is complete for the test driver records.
- The sidebar remains outside the scrollable content area.
- No serious errors appear in the browser or API logs during the test plan.
- The staging configuration uses safe test credentials and does not expose secrets.

---

## 10. Final assessment

The system has progressed from a prototype with several confirmed defects to a stronger role-based reporting application with the main previously reported issues addressed.

**Current recommendation:** Deploy to a controlled staging environment and perform the full test plan above. Do not announce it as production-ready until database setup, role isolation, notification behavior, emergency contact tracing, security configuration, and real browser testing have all passed.

The most immediate setup requirement for another developer or tester is enabling the correct PHP PDO database driver and creating their own local database configuration. The “could not find driver” message is an environment setup problem that must be fixed on that computer before the application can communicate with the database.

---

## 11. Simple glossary

- **API:** The server-side part of the system that receives requests, reads data, and saves changes.
- **Database:** The structured storage where users, reports, drivers, reviews, and notifications are kept.
- **Dashboard:** The main starting page for a role.
- **PDO driver:** A PHP component that allows PHP to communicate with a particular database type.
- **Staging:** A private test environment that is similar to production but is not yet public.
- **Production:** The live environment used by real users.
- **Role:** The type of account a person has, such as student, driver, or authorized personnel.
- **SOS:** The emergency feature used to request attention and identify relevant driver information.

