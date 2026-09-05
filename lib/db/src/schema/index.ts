import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "STUDENT",
  "DRIVER",
  "TODA_OFFICER",
  "ADMIN",
  "PNP",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const complaintStatusEnum = pgEnum("complaint_status", [
  "SUBMITTED",
  "RECEIVED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REFERRED",
  "RESOLVED",
  "CLOSED",
]);

export const todaTable = pgTable("todas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  barangay: varchar("barangay", { length: 120 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  province: varchar("province", { length: 120 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 180 }).notNull(),
    email: varchar("email", { length: 180 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    status: accountStatusEnum("status").notNull().default("ACTIVE"),
    contactNumber: varchar("contact_number", { length: 60 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    roleIndex: index("users_role_idx").on(table.role),
  }),
);

export const studentsTable = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => usersTable.id),
    studentId: varchar("student_id", { length: 80 }).notNull(),
    program: varchar("program", { length: 180 }),
    yearLevel: varchar("year_level", { length: 40 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userUnique: uniqueIndex("students_user_unique").on(table.userId),
    studentUnique: uniqueIndex("students_student_id_unique").on(table.studentId),
  }),
);

export const driversTable = pgTable(
  "drivers",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => usersTable.id),
    todaId: integer("toda_id").notNull().references(() => todaTable.id),
    fullName: varchar("full_name", { length: 180 }).notNull(),
    driverCode: varchar("driver_code", { length: 80 }).notNull(),
    tricycleIdentifier: varchar("tricycle_identifier", { length: 80 }).notNull(),
    plateNumber: varchar("plate_number", { length: 80 }),
    routeArea: varchar("route_area", { length: 180 }),
    contactNumber: varchar("contact_number", { length: 60 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    codeUnique: uniqueIndex("drivers_code_unique").on(table.driverCode),
    tricycleUnique: uniqueIndex("drivers_tricycle_identifier_unique").on(table.tricycleIdentifier),
    todaIndex: index("drivers_toda_idx").on(table.todaId),
  }),
);

export const complaintCategoriesTable = pgTable(
  "complaint_categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameUnique: uniqueIndex("complaint_categories_name_unique").on(table.name),
  }),
);

export const complaintsTable = pgTable(
  "complaints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceNumber: varchar("reference_number", { length: 40 }).notNull(),
    studentUserId: uuid("student_user_id").notNull().references(() => usersTable.id),
    driverId: integer("driver_id").notNull().references(() => driversTable.id),
    categoryId: integer("category_id").notNull().references(() => complaintCategoriesTable.id),
    status: complaintStatusEnum("status").notNull().default("SUBMITTED"),
    incidentDate: date("incident_date").notNull(),
    incidentTime: varchar("incident_time", { length: 8 }).notNull(),
    location: varchar("location", { length: 240 }).notNull(),
    description: text("description").notNull(),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    referenceUnique: uniqueIndex("complaints_reference_unique").on(table.referenceNumber),
    studentIndex: index("complaints_student_idx").on(table.studentUserId),
    driverIndex: index("complaints_driver_idx").on(table.driverId),
    statusIndex: index("complaints_status_idx").on(table.status),
  }),
);

export const complaintAttachmentsTable = pgTable("complaint_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  complaintId: uuid("complaint_id").notNull().references(() => complaintsTable.id),
  originalName: varchar("original_name", { length: 240 }).notNull(),
  storedName: varchar("stored_name", { length: 260 }).notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const complaintStatusHistoryTable = pgTable("complaint_status_history", {
  id: serial("id").primaryKey(),
  complaintId: uuid("complaint_id").notNull().references(() => complaintsTable.id),
  previousStatus: complaintStatusEnum("previous_status"),
  newStatus: complaintStatusEnum("new_status").notNull(),
  changedBy: uuid("changed_by").references(() => usersTable.id),
  remarks: text("remarks"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const complaintActionsTable = pgTable("complaint_actions", {
  id: serial("id").primaryKey(),
  complaintId: uuid("complaint_id").notNull().references(() => complaintsTable.id),
  actionType: varchar("action_type", { length: 80 }).notNull(),
  description: text("description").notNull(),
  actionTakenBy: uuid("action_taken_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const violationsTable = pgTable("violations", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => driversTable.id),
  complaintId: uuid("complaint_id").notNull().references(() => complaintsTable.id),
  violationCategory: varchar("violation_category", { length: 140 }).notNull(),
  description: text("description").notNull(),
  confirmedBy: uuid("confirmed_by").notNull().references(() => usersTable.id),
  remarks: text("remarks"),
  confirmationDate: timestamp("confirmation_date", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientUserId: uuid("recipient_user_id").notNull().references(() => usersTable.id),
  type: varchar("type", { length: 80 }).notNull(),
  message: text("message").notNull(),
  relatedComplaintId: uuid("related_complaint_id").references(() => complaintsTable.id),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id),
  action: varchar("action", { length: 120 }).notNull(),
  targetType: varchar("target_type", { length: 80 }),
  targetId: varchar("target_id", { length: 120 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ComplaintStatus = (typeof complaintStatusEnum.enumValues)[number];
