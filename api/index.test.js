import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { database } = vi.hoisted(() => ({
  database: {
    report: {
      id: "report-1",
      status: "UNDER_REVIEW",
      createdAt: new Date("2026-10-28T08:00:00.000Z"),
      updatedAt: new Date("2026-10-28T09:00:00.000Z"),
    },
    student: { id: "student-1", role: "STUDENT", status: "ACTIVE" },
    history: [
      { status: "SUBMITTED", occurredAt: new Date("2026-10-28T08:00:00.000Z") },
      { status: "UNDER_REVIEW", occurredAt: new Date("2026-10-28T09:00:00.000Z") },
    ],
  },
}));

vi.mock("pg", () => ({
  default: {
    Pool: class MockPool {
      async query(sql, params = []) {
        if (sql.includes("SELECT 1")) return { rows: [{ "?column?": 1 }] };
        if (sql.includes("COUNT(*)::int AS attempts")) return { rows: [{ attempts: 0 }] };
        if (sql.includes("FROM users WHERE id=$1")) return { rows: [database.student] };
        if (sql.includes("information_schema.columns") && sql.includes("local_report_id")) return { rows: [{ available: true }] };
        if (sql.includes("COUNT(*)::int AS count") && sql.includes("information_schema.columns")) return { rows: [{ count: 4 }] };
        if (sql.includes("FROM drivers WHERE id=$1 AND is_active=1")) return { rows: [{ id: 1 }] };
        if (sql.includes("FROM complaint_categories WHERE id=$1 AND is_active=1")) return { rows: [{ id: 2 }] };
        if (sql.includes("FROM complaints WHERE student_user_id=$1 AND local_report_id=$2")) return { rows: [] };
        if (sql.startsWith("INSERT INTO complaints")) return { rows: [] };
        if (["BEGIN", "COMMIT", "ROLLBACK"].includes(sql)) return { rows: [] };
        if (sql.includes("INSERT INTO audit_logs")) return { rows: [] };
        if (sql.includes("FROM complaints WHERE reference_number")) {
          return { rows: params[0] === "TRC-2026-123456" ? [database.report] : [] };
        }
        if (sql.includes("FROM complaint_status_history")) return { rows: database.history };
        return { rows: [] };
      }

      async connect() {
        return { query: this.query.bind(this), release() {} };
      }

      on() {}
    },
  },
}));

process.env.JWT_SECRET = "unit-test-only-secret";

let server;
let baseUrl;

beforeAll(async () => {
  const { default: app } = await import("./index.js");
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}, 30000);

afterAll(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("online API readiness and public tracking", () => {
  it("reports database readiness from /readyz", async () => {
    const response = await fetch(`${baseUrl}/readyz`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok", database: "ok" });
  });

  it("rejects malformed tracking references before querying a report", async () => {
    const response = await fetch(`${baseUrl}/public/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: "not-a-reference" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: "Enter the tracking number in the format TRC-YYYY-123456." },
    });
  });

  it("returns status and progress history for a valid public tracking reference", async () => {
    const response = await fetch(`${baseUrl}/public/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: "trc-2026-123456" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.tracking).toMatchObject({
      status: "Under review",
      aiGenerated: false,
      timeline: [
        { status: "Submitted", occurredAt: "2026-10-28T08:00:00.000Z" },
        { status: "Under review", occurredAt: "2026-10-28T09:00:00.000Z" },
      ],
    });
    expect(payload.tracking.aiExplanation).toContain("being reviewed");
  });

  it("returns a clear 404 when no report has that reference", async () => {
    const response = await fetch(`${baseUrl}/public/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: "TRC-2026-999999" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { message: "No report was found for that tracking number. Check it and try again." },
    });
  });

  it("accepts a valid student report and returns a tracking reference", async () => {
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign({ sub: database.student.id }, process.env.JWT_SECRET);
    const form = new FormData();
    form.set("localReportId", "offline-test-1");
    form.set("driverId", "1");
    form.set("categoryId", "2");
    form.set("incidentDate", "2026-10-28");
    form.set("incidentTime", "16:00");
    form.set("location", "Old Sagay route");
    form.set("description", "A unit test report with enough detail.");

    const response = await fetch(`${baseUrl}/complaints`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.complaint.status).toBe("SUBMITTED");
    expect(payload.complaint.referenceNumber).toMatch(/^TRC-\d{4}-\d{6}$/);
  });
});
