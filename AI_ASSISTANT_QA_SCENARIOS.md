# AI Conduct Assistant QA Scenarios

Use test accounts and fictional report details. Configure `GEMINI_API_KEY` on the backend before testing successful AI responses. Never use real student names or identifying information in QA prompts.

## 1. Student report drafting

1. Sign in as a student and open **Submit a report**.
2. Select a driver, enter a category, and write a short factual description in the incident step.
3. Select **Get AI suggestions**.
4. Confirm a summary, a distinct **Description of what happened**, a neutral suggested draft, suggestions, and any details to clarify appear.
5. Select **Use this description** and verify the report text area changes to that description. Check that it uses only details from the concern category and your notes.
6. Edit the draft and continue through review. Confirm the report is not submitted until the student explicitly submits it.

Expected: the AI does not invent dates, witnesses, evidence, or actions. If the category is selected but the notes do not say what happened, it asks for facts instead of guessing. Staff/student can edit or ignore its description.

## 2. Human review assistance

1. Sign in as an authorized reviewer and open a submitted report in **Review workspace**.
2. Select **Get AI suggestions**.
3. Confirm the assistant summarizes the reporter statement and lists neutral clarification points.
4. Compare its suggestions with the source statement; continue the review using human judgment.

Expected: the assistant does not claim an allegation is true, assign fault, or recommend discipline. No status changes are made by AI.

## 3. Dashboard summary

1. Sign in as the superadmin and open the admin dashboard overview.
2. Select **Get AI suggestions** in the AI Conduct Assistant.
3. Confirm the response describes only visible category/status counts and identifies that the dashboard sample is limited to loaded reports.

Expected: only aggregate counts are included; no individual report description is sent from this view.

## 4. Unconfigured provider

1. Temporarily run the backend without `GEMINI_API_KEY` in a local test environment.
2. Select **Get AI suggestions**.

Expected: a clear “AI assistant is not configured” message appears; the report form and regular workflow remain usable.

## 5. Input and authorization checks

1. Try to request suggestions with an empty report description.
2. As a student, try to call the review or dashboard task through the API; as a reviewer, try the report-drafting task.
3. Try sending content longer than 12,000 characters directly to the API.

Expected: the UI asks for report details, unauthorized tasks return HTTP 403, and oversized input returns HTTP 400.

## 6. Provider failure

1. Configure an invalid test key or temporarily block outbound AI access in a local test environment.
2. Request suggestions.

Expected: a readable error appears, the UI becomes usable again, and the user can continue without AI. No report is submitted or modified automatically.

## 7. Public landing-page report tracking

1. Sign out, open the landing page, and select **Track a report**.
2. Enter a valid test report number in the format `TRC-YYYY-123456` and select **View status**.
3. Confirm the page shows current status, last updated time, status-only progress history, and a short Gemini explanation without requiring login.
4. Try an invalid number and a well-formed number that does not exist.
5. Make more than 12 lookups from the same client within 15 minutes.

Expected: invalid/nonexistent values show a generic error; repeated attempts are rate-limited. Public results never include the student's name, driver name, incident description, location, review remarks, attachments, or action notes. If Gemini is unavailable, the status and a general status guide remain visible.
