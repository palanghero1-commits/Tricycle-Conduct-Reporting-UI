import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import {
  auditLogsTable,
  complaintActionsTable,
  complaintAttachmentsTable,
  complaintCategoriesTable,
  complaintsTable,
  complaintStatusHistoryTable,
  driversTable,
  notificationsTable,
  studentsTable,
  todaTable,
  usersTable,
  violationsTable,
  type ComplaintStatus,
  type UserRole,
} from "@workspace/db/schema";
import { db } from "@workspace/db";

const router = Router();
const jwtSecret = process.env.JWT_SECRET ?? "dev-only-change-me";
const uploadRoot = process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), "uploads");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const statusValues: [ComplaintStatus, ...ComplaintStatus[]] = ["SUBMITTED", "RECEIVED", "UNDER_REVIEW", "VERIFIED", "REFERRED", "RESOLVED", "CLOSED"];
const allowedTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
  SUBMITTED: ["RECEIVED", "UNDER_REVIEW", "CLOSED"],
  RECEIVED: ["UNDER_REVIEW", "REFERRED", "CLOSED"],
  UNDER_REVIEW: ["VERIFIED", "REFERRED", "RESOLVED", "CLOSED"],
  VERIFIED: ["REFERRED", "RESOLVED", "CLOSED"],
  REFERRED: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

fs.mkdirSync(uploadRoot, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => cb(null, allowedMimeTypes.has(file.mimetype)),
});

type AuthUser = { id: string; role: UserRole; email: string; fullName: string; status: "ACTIVE" | "INACTIVE" };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: { message } });
}

function tokenFor(user: AuthUser) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: "8h" });
}

async function audit(userId: string | null, action: string, targetType?: string, targetId?: string, metadata?: unknown) {
  await db.insert(auditLogsTable).values({ userId, action, targetType, targetId, metadata });
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.token;
  if (!token) return sendError(res, 401, "Authentication required.");
  try {
    const payload = jwt.verify(token, jwtSecret) as { sub: string };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1);
    if (!user || user.status !== "ACTIVE") return sendError(res, 401, "Account is not active.");
    req.user = { id: user.id, role: user.role, email: user.email, fullName: user.fullName, status: user.status };
    next();
  } catch {
    sendError(res, 401, "Invalid or expired session.");
  }
}

function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return sendError(res, 403, "You are not authorized to access this resource.");
    next();
  };
}

async function notify(recipientUserId: string, type: string, message: string, relatedComplaintId?: string) {
  await db.insert(notificationsTable).values({ recipientUserId, type, message, relatedComplaintId });
}

async function notifyOfficers(type: string, message: string, complaintId: string) {
  const officers = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.status, "ACTIVE"), or(eq(usersTable.role, "TODA_OFFICER"), eq(usersTable.role, "ADMIN"))));
  await Promise.all(officers.map((officer) => notify(officer.id, type, message, complaintId)));
}

const registerSchema = z.object({
  fullName: z.string().min(2).max(180),
  studentId: z.string().min(3).max(80),
  email: z.string().email().max(180),
  contactNumber: z.string().max(60).optional(),
  program: z.string().max(180).optional(),
  yearLevel: z.string().max(40).optional(),
  password: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
}).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

router.post("/auth/register", async (req, res) => {
  const input = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await db.transaction(async (tx) => {
    const [user] = await tx.insert(usersTable).values({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      passwordHash,
      role: "STUDENT",
      contactNumber: input.contactNumber,
    }).returning();
    await tx.insert(studentsTable).values({ userId: user.id, studentId: input.studentId, program: input.program, yearLevel: input.yearLevel });
    await tx.insert(auditLogsTable).values({ userId: user.id, action: "REGISTER", targetType: "users", targetId: user.id });
    return user;
  });
  const safeUser = { id: result.id, fullName: result.fullName, email: result.email, role: result.role };
  res.status(201).json({ user: safeUser, token: tokenFor({ ...safeUser, status: result.status }) });
});

router.post("/auth/login", async (req, res) => {
  const input = z.object({ email: z.string().min(1), password: z.string().min(1) }).parse(req.body);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, input.email.toLowerCase())).limit(1);
  if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(input.password, user.passwordHash))) return sendError(res, 401, "Invalid email or password.");
  await audit(user.id, "LOGIN", "users", user.id);
  res.json({ user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role }, token: tokenFor(user) });
});

router.post("/auth/logout", requireAuth, async (req, res) => {
  await audit(req.user!.id, "LOGOUT", "users", req.user!.id);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

router.get("/drivers", requireAuth, async (req, res) => {
  const q = z.object({ search: z.string().optional(), active: z.string().optional() }).parse(req.query);
  const where = and(
    q.active === "false" ? eq(driversTable.isActive, false) : eq(driversTable.isActive, true),
    q.search ? or(ilike(driversTable.fullName, `%${q.search}%`), ilike(driversTable.driverCode, `%${q.search}%`), ilike(driversTable.tricycleIdentifier, `%${q.search}%`)) : undefined,
  );
  res.json({ drivers: await db.select().from(driversTable).where(where).orderBy(asc(driversTable.fullName)).limit(100) });
});

router.get("/categories", requireAuth, async (_req, res) => {
  res.json({ categories: await db.select().from(complaintCategoriesTable).where(eq(complaintCategoriesTable.isActive, true)).orderBy(asc(complaintCategoriesTable.name)) });
});

const complaintBodySchema = z.object({
  driverId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  incidentTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(3).max(240),
  description: z.string().min(15).max(2000),
});

router.post("/complaints", requireAuth, requireRoles("STUDENT"), upload.array("attachments", 5), async (req, res) => {
  const input = complaintBodySchema.parse(req.body);
  const files = (req.files as Express.Multer.File[]) ?? [];
  const referenceNumber = `TRC-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;
  const complaint = await db.transaction(async (tx) => {
    const [driver] = await tx.select().from(driversTable).where(and(eq(driversTable.id, input.driverId), eq(driversTable.isActive, true))).limit(1);
    const [category] = await tx.select().from(complaintCategoriesTable).where(and(eq(complaintCategoriesTable.id, input.categoryId), eq(complaintCategoriesTable.isActive, true))).limit(1);
    if (!driver || !category) throw new Error("Invalid driver or category.");
    const [created] = await tx.insert(complaintsTable).values({ ...input, referenceNumber, studentUserId: req.user!.id, status: "SUBMITTED" }).returning();
    if (files.length) {
      await tx.insert(complaintAttachmentsTable).values(files.map((file) => ({
        complaintId: created.id,
        originalName: path.basename(file.originalname),
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath: file.path,
        uploadedBy: req.user!.id,
      })));
    }
    await tx.insert(complaintStatusHistoryTable).values({ complaintId: created.id, previousStatus: null, newStatus: "SUBMITTED", changedBy: req.user!.id, remarks: "Complaint submitted by student." });
    await tx.insert(auditLogsTable).values({ userId: req.user!.id, action: "COMPLAINT_CREATE", targetType: "complaints", targetId: created.id });
    return created;
  });
  await notify(req.user!.id, "COMPLAINT_SUBMITTED", `Complaint ${complaint.referenceNumber} was submitted.`, complaint.id);
  await notifyOfficers("NEW_COMPLAINT", `New complaint ${complaint.referenceNumber} requires review.`, complaint.id);
  res.status(201).json({ complaint });
});

function buildComplaintWhere(req: Request) {
  const q = z.object({
    status: z.enum(statusValues).optional(),
    categoryId: z.coerce.number().optional(),
    driverId: z.coerce.number().optional(),
    reference: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }).parse(req.query);
  return and(
    req.user!.role === "STUDENT" ? eq(complaintsTable.studentUserId, req.user!.id) : undefined,
    q.status ? eq(complaintsTable.status, q.status) : undefined,
    q.categoryId ? eq(complaintsTable.categoryId, q.categoryId) : undefined,
    q.driverId ? eq(complaintsTable.driverId, q.driverId) : undefined,
    q.reference ? ilike(complaintsTable.referenceNumber, `%${q.reference}%`) : undefined,
    q.from ? gte(complaintsTable.createdAt, new Date(String(q.from))) : undefined,
    q.to ? lte(complaintsTable.createdAt, new Date(String(q.to))) : undefined,
  );
}

router.get("/complaints", requireAuth, async (req, res) => {
  const complaints = await db.select().from(complaintsTable).where(buildComplaintWhere(req)).orderBy(desc(complaintsTable.createdAt)).limit(100);
  res.json({ complaints });
});

router.get("/complaints/:id", requireAuth, async (req, res) => {
  const complaintId = String(req.params.id);
  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, complaintId)).limit(1);
  if (!complaint) return sendError(res, 404, "Complaint not found.");
  if (req.user!.role === "STUDENT" && complaint.studentUserId !== req.user!.id) return sendError(res, 403, "You are not authorized to view this complaint.");
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, complaint.driverId)).limit(1);
  const [category] = await db.select().from(complaintCategoriesTable).where(eq(complaintCategoriesTable.id, complaint.categoryId)).limit(1);
  const history = await db.select().from(complaintStatusHistoryTable).where(eq(complaintStatusHistoryTable.complaintId, complaint.id)).orderBy(asc(complaintStatusHistoryTable.createdAt));
  const actions = await db.select().from(complaintActionsTable).where(eq(complaintActionsTable.complaintId, complaint.id)).orderBy(desc(complaintActionsTable.createdAt));
  const attachments = await db.select({ id: complaintAttachmentsTable.id, originalName: complaintAttachmentsTable.originalName, mimeType: complaintAttachmentsTable.mimeType, sizeBytes: complaintAttachmentsTable.sizeBytes, createdAt: complaintAttachmentsTable.createdAt }).from(complaintAttachmentsTable).where(eq(complaintAttachmentsTable.complaintId, complaint.id));
  const violation = await db.select().from(violationsTable).where(eq(violationsTable.complaintId, complaint.id)).limit(1);
  res.json({ complaint, driver, category, history, actions, attachments, violation: violation[0] ?? null });
});

router.get("/attachments/:id", requireAuth, async (req, res) => {
  const [attachment] = await db.select().from(complaintAttachmentsTable).where(eq(complaintAttachmentsTable.id, String(req.params.id))).limit(1);
  if (!attachment) return sendError(res, 404, "Attachment not found.");
  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, attachment.complaintId)).limit(1);
  if (!complaint) return sendError(res, 404, "Complaint not found.");
  if (req.user!.role === "STUDENT" && complaint.studentUserId !== req.user!.id) return sendError(res, 403, "You are not authorized to view this attachment.");
  res.type(attachment.mimeType);
  res.download(attachment.storagePath, attachment.originalName);
});

router.patch("/complaints/:id/status", requireAuth, requireRoles("TODA_OFFICER", "ADMIN", "PNP"), async (req, res) => {
  const input = z.object({ status: z.enum(statusValues), remarks: z.string().max(1000).optional() }).parse(req.body);
  const complaintId = String(req.params.id);
  const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, complaintId)).limit(1);
  if (!existing) return sendError(res, 404, "Complaint not found.");
  if (!allowedTransitions[existing.status].includes(input.status)) return sendError(res, 400, "That status transition is not allowed.");
  const [updated] = await db.transaction(async (tx) => {
    const [row] = await tx.update(complaintsTable).set({ status: input.status, updatedAt: new Date() }).where(eq(complaintsTable.id, existing.id)).returning();
    await tx.insert(complaintStatusHistoryTable).values({ complaintId: existing.id, previousStatus: existing.status, newStatus: input.status, changedBy: req.user!.id, remarks: input.remarks });
    await tx.insert(auditLogsTable).values({ userId: req.user!.id, action: "COMPLAINT_STATUS_UPDATE", targetType: "complaints", targetId: existing.id, metadata: { from: existing.status, to: input.status } });
    return [row];
  });
  await notify(existing.studentUserId, "COMPLAINT_STATUS_UPDATED", `Complaint ${existing.referenceNumber} is now ${input.status.replaceAll("_", " ")}.`, existing.id);
  res.json({ complaint: updated });
});

router.post("/complaints/:id/actions", requireAuth, requireRoles("TODA_OFFICER", "ADMIN", "PNP"), async (req, res) => {
  const input = z.object({ actionType: z.string().min(2).max(80), description: z.string().min(3).max(2000) }).parse(req.body);
  const complaintId = String(req.params.id);
  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, complaintId)).limit(1);
  if (!complaint) return sendError(res, 404, "Complaint not found.");
  const [action] = await db.insert(complaintActionsTable).values({ complaintId: complaint.id, actionType: input.actionType, description: input.description, actionTakenBy: req.user!.id }).returning();
  await audit(req.user!.id, "COMPLAINT_ACTION_CREATE", "complaint_actions", String(action.id), { complaintId: complaint.id });
  await notify(complaint.studentUserId, "COMPLAINT_ACTION_RECORDED", `An action was recorded for complaint ${complaint.referenceNumber}.`, complaint.id);
  res.status(201).json({ action });
});

router.post("/complaints/:id/violations", requireAuth, requireRoles("TODA_OFFICER", "ADMIN", "PNP"), async (req, res) => {
  const input = z.object({ violationCategory: z.string().min(2).max(140), description: z.string().min(5).max(2000), remarks: z.string().max(1000).optional() }).parse(req.body);
  const complaintId = String(req.params.id);
  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, complaintId)).limit(1);
  if (!complaint) return sendError(res, 404, "Complaint not found.");
  if (!["VERIFIED", "RESOLVED", "CLOSED"].includes(complaint.status)) return sendError(res, 400, "A confirmed violation can only be recorded after appropriate review.");
  const [violation] = await db.insert(violationsTable).values({ ...input, complaintId: complaint.id, driverId: complaint.driverId, confirmedBy: req.user!.id }).returning();
  await audit(req.user!.id, "VIOLATION_CREATE", "violations", String(violation.id), { complaintId: complaint.id });
  res.status(201).json({ violation });
});

router.get("/notifications", requireAuth, async (req, res) => {
  const notifications = await db.select().from(notificationsTable).where(eq(notificationsTable.recipientUserId, req.user!.id)).orderBy(desc(notificationsTable.createdAt)).limit(100);
  const unread = notifications.filter((item) => !item.readAt).length;
  res.json({ notifications, unread });
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  await db.update(notificationsTable).set({ readAt: new Date() }).where(and(eq(notificationsTable.id, String(req.params.id)), eq(notificationsTable.recipientUserId, req.user!.id)));
  res.json({ ok: true });
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  await db.update(notificationsTable).set({ readAt: new Date() }).where(eq(notificationsTable.recipientUserId, req.user!.id));
  res.json({ ok: true });
});

router.get("/dashboard/stats", requireAuth, requireRoles("TODA_OFFICER", "ADMIN", "PNP"), async (_req, res) => {
  const byStatus = await db.select({ status: complaintsTable.status, total: count() }).from(complaintsTable).groupBy(complaintsTable.status);
  const [violations] = await db.select({ total: count() }).from(violationsTable);
  res.json({ byStatus, confirmedViolations: violations.total });
});

router.get("/reports/summary", requireAuth, requireRoles("ADMIN", "TODA_OFFICER", "PNP"), async (req, res) => {
  const where = buildComplaintWhere(req);
  const byStatus = await db.select({ label: complaintsTable.status, total: count() }).from(complaintsTable).where(where).groupBy(complaintsTable.status);
  const byCategory = await db.select({ label: complaintCategoriesTable.name, total: count() }).from(complaintsTable).innerJoin(complaintCategoriesTable, eq(complaintsTable.categoryId, complaintCategoriesTable.id)).where(where).groupBy(complaintCategoriesTable.name);
  const monthly = await db.select({ label: sql<string>`to_char(${complaintsTable.createdAt}, 'YYYY-MM')`, total: count() }).from(complaintsTable).where(where).groupBy(sql`to_char(${complaintsTable.createdAt}, 'YYYY-MM')`);
  res.json({ byStatus, byCategory, monthly });
});

router.get("/admin/users", requireAuth, requireRoles("ADMIN"), async (req, res) => {
  const q = z.object({ search: z.string().optional(), role: z.enum(["STUDENT", "DRIVER", "TODA_OFFICER", "ADMIN", "PNP"]).optional(), status: z.enum(["ACTIVE", "INACTIVE"]).optional() }).parse(req.query);
  const users = await db.select({ id: usersTable.id, fullName: usersTable.fullName, email: usersTable.email, role: usersTable.role, status: usersTable.status, createdAt: usersTable.createdAt }).from(usersTable).where(and(q.search ? or(ilike(usersTable.fullName, `%${q.search}%`), ilike(usersTable.email, `%${q.search}%`)) : undefined, q.role ? eq(usersTable.role, q.role) : undefined, q.status ? eq(usersTable.status, q.status) : undefined)).orderBy(desc(usersTable.createdAt)).limit(100);
  res.json({ users });
});

router.post("/admin/users", requireAuth, requireRoles("ADMIN"), async (req, res) => {
  const input = z.object({
    fullName: z.string().min(2).max(180),
    email: z.string().email().max(180),
    password: z.string().min(8).max(100),
    role: z.enum(["DRIVER", "TODA_OFFICER", "ADMIN", "PNP"]),
    contactNumber: z.string().max(60).optional(),
  }).parse(req.body);
  const [user] = await db.insert(usersTable).values({
    fullName: input.fullName,
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password, 12),
    role: input.role,
    contactNumber: input.contactNumber,
  }).returning();
  await audit(req.user!.id, "USER_CREATE", "users", user.id, { role: input.role });
  res.status(201).json({ user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, status: user.status } });
});

router.patch("/admin/users/:id", requireAuth, requireRoles("ADMIN"), async (req, res) => {
  const input = z.object({
    fullName: z.string().min(2).max(180).optional(),
    role: z.enum(["STUDENT", "DRIVER", "TODA_OFFICER", "ADMIN", "PNP"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    contactNumber: z.string().max(60).nullable().optional(),
  }).parse(req.body);
  const [user] = await db.update(usersTable).set({ ...input, updatedAt: new Date() }).where(eq(usersTable.id, String(req.params.id))).returning();
  if (!user) return sendError(res, 404, "User not found.");
  await audit(req.user!.id, "USER_UPDATE", "users", user.id, input);
  res.json({ user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, status: user.status } });
});

router.post("/admin/drivers", requireAuth, requireRoles("ADMIN"), async (req, res) => {
  const input = z.object({
    todaId: z.number().int().positive().default(1),
    fullName: z.string().min(2).max(180),
    driverCode: z.string().min(2).max(80),
    tricycleIdentifier: z.string().min(2).max(80),
    plateNumber: z.string().max(80).optional(),
    routeArea: z.string().max(180).optional(),
    contactNumber: z.string().max(60).optional(),
    userId: z.string().uuid().optional(),
  }).parse(req.body);
  const [driver] = await db.insert(driversTable).values(input).returning();
  await audit(req.user!.id, "DRIVER_CREATE", "drivers", String(driver.id));
  res.status(201).json({ driver });
});

router.patch("/admin/drivers/:id", requireAuth, requireRoles("ADMIN"), async (req, res) => {
  const input = z.object({
    fullName: z.string().min(2).max(180).optional(),
    tricycleIdentifier: z.string().min(2).max(80).optional(),
    plateNumber: z.string().max(80).nullable().optional(),
    routeArea: z.string().max(180).nullable().optional(),
    contactNumber: z.string().max(60).nullable().optional(),
    isActive: z.boolean().optional(),
  }).parse(req.body);
  const [driver] = await db.update(driversTable).set({ ...input, updatedAt: new Date() }).where(eq(driversTable.id, Number(req.params.id))).returning();
  if (!driver) return sendError(res, 404, "Driver not found.");
  await audit(req.user!.id, "DRIVER_UPDATE", "drivers", String(driver.id), input);
  res.json({ driver });
});

router.post("/admin/categories", requireAuth, requireRoles("ADMIN"), async (req, res) => {
  const input = z.object({ name: z.string().min(2).max(120), description: z.string().max(1000).optional() }).parse(req.body);
  const [category] = await db.insert(complaintCategoriesTable).values(input).returning();
  await audit(req.user!.id, "CATEGORY_CREATE", "complaint_categories", String(category.id));
  res.status(201).json({ category });
});

router.patch("/admin/categories/:id", requireAuth, requireRoles("ADMIN"), async (req, res) => {
  const input = z.object({ name: z.string().min(2).max(120).optional(), description: z.string().max(1000).nullable().optional(), isActive: z.boolean().optional() }).parse(req.body);
  const [category] = await db.update(complaintCategoriesTable).set(input).where(eq(complaintCategoriesTable.id, Number(req.params.id))).returning();
  if (!category) return sendError(res, 404, "Category not found.");
  await audit(req.user!.id, "CATEGORY_UPDATE", "complaint_categories", String(category.id), input);
  res.json({ category });
});

router.post("/seed", async (_req, res) => {
  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD ?? "Password123!", 12);
  const [toda] = await db.insert(todaTable).values({ name: "Old Sagay TODA", barangay: "Old Sagay", city: "Sagay City", province: "Negros Occidental" }).onConflictDoNothing().returning();
  for (const name of ["Overcharging", "Reckless Driving", "Refusal to Transport", "Discourteous Behavior", "Unsafe Driving", "Other"]) {
    await db.insert(complaintCategoriesTable).values({ name }).onConflictDoNothing();
  }
  const todaId = toda?.id ?? (await db.select().from(todaTable).limit(1))[0].id;
  await db.insert(driversTable).values([
    { todaId, fullName: "Rogelio D. Santos", driverCode: "DRV-OS-4821", tricycleIdentifier: "OS-4821", routeArea: "Old Sagay Market loop" },
    { todaId, fullName: "Maribel A. Cruz", driverCode: "DRV-OS-3176", tricycleIdentifier: "OS-3176", routeArea: "Old Sagay Campus loop" },
    { todaId, fullName: "Jonas P. Villanueva", driverCode: "DRV-OS-9084", tricycleIdentifier: "OS-9084", routeArea: "Old Sagay Riverside loop" },
  ]).onConflictDoNothing();
  await db.insert(usersTable).values({ fullName: "Admin User", email: "admin@oldsagay.gov.ph", passwordHash, role: "ADMIN" }).onConflictDoNothing();
  await db.insert(usersTable).values({ fullName: "TODA Officer", email: "officer@oldsagay.gov.ph", passwordHash, role: "TODA_OFFICER" }).onConflictDoNothing();
  res.json({ ok: true, seededPassword: process.env.SEED_PASSWORD ? undefined : "Password123!" });
});

router.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: { message: "Validation failed.", issues: err.issues } });
    return;
  }
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: { message: err.message } });
    return;
  }
  const message = err instanceof Error && err.message === "Invalid driver or category." ? err.message : "The request could not be completed.";
  res.status(message === "The request could not be completed." ? 500 : 400).json({ error: { message } });
});

export default router;
