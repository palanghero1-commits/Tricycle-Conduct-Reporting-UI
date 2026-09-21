-- PostgreSQL schema for Supabase.
-- Run this in the Supabase SQL editor for the online environment.
-- The PHP API intentionally uses SMALLINT for MySQL-compatible boolean flags.

CREATE TABLE IF NOT EXISTS todas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  barangay VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  province VARCHAR(120) NOT NULL,
  president_user_id UUID,
  is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  full_name VARCHAR(180) NOT NULL,
  email VARCHAR(180) UNIQUE,
  username VARCHAR(100) UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('STUDENT','DRIVER','TODA_PRESIDENT','AUTHORIZED_PERSONNEL','SUPERADMIN','PNP')),
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PENDING','INACTIVE','SUSPENDED')),
  contact_number VARCHAR(60),
  created_by UUID,
  profile_photo_path VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_creator_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE todas DROP CONSTRAINT IF EXISTS todas_president_fk;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_creator_fk;
ALTER TABLE todas ADD CONSTRAINT todas_president_fk FOREIGN KEY (president_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT users_creator_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  report_updates SMALLINT NOT NULL DEFAULT 1 CHECK (report_updates IN (0, 1)),
  reminders SMALLINT NOT NULL DEFAULT 0 CHECK (reminders IN (0, 1)),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authorized_personnel (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  personnel_type VARCHAR(32) NOT NULL CHECK (personnel_type IN ('BARANGAY_STAFF','SCHOOL_COORDINATOR','PNP_REVIEWER','SYSTEM_ADMIN')),
  office_name VARCHAR(180) NOT NULL,
  position_title VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  student_id VARCHAR(80) NOT NULL UNIQUE,
  program VARCHAR(180),
  year_level VARCHAR(40),
  campus VARCHAR(120) DEFAULT 'SUNN',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  toda_id INTEGER NOT NULL REFERENCES todas(id),
  full_name VARCHAR(180) NOT NULL,
  driver_code VARCHAR(80) NOT NULL UNIQUE,
  tricycle_identifier VARCHAR(80) NOT NULL UNIQUE,
  plate_number VARCHAR(80),
  route_area VARCHAR(180),
  contact_number VARCHAR(60),
  account_created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  account_creation_reason VARCHAR(32) NOT NULL DEFAULT 'SELF_REGISTERED' CHECK (account_creation_reason IN ('SELF_REGISTERED','TODA_CREATED_NO_PHONE','AUTHORIZED_CREATED')),
  is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS drivers_toda_idx ON drivers(toda_id);
CREATE INDEX IF NOT EXISTS drivers_active_idx ON drivers(is_active);

CREATE TABLE IF NOT EXISTS complaint_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY,
  reference_number VARCHAR(40) NOT NULL UNIQUE,
  student_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  driver_id INTEGER NOT NULL REFERENCES drivers(id),
  category_id INTEGER NOT NULL REFERENCES complaint_categories(id),
  status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','RECEIVED','UNDER_REVIEW','VERIFIED','REFERRED','RESOLVED','CLOSED')),
  incident_date DATE NOT NULL,
  incident_time VARCHAR(8) NOT NULL,
  location VARCHAR(240) NOT NULL,
  description TEXT NOT NULL,
  review_notes TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS complaints_student_idx ON complaints(student_user_id);
CREATE INDEX IF NOT EXISTS complaints_driver_idx ON complaints(driver_id);
CREATE INDEX IF NOT EXISTS complaints_status_idx ON complaints(status);

CREATE TABLE IF NOT EXISTS complaint_attachments (
  id UUID PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES complaints(id),
  original_name VARCHAR(240) NOT NULL,
  stored_name VARCHAR(260) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
  id SERIAL PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES complaints(id),
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_actions (
  id SERIAL PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES complaints(id),
  action_type VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  action_taken_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS violations (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id),
  complaint_id UUID NOT NULL REFERENCES complaints(id),
  violation_category VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  remarks TEXT,
  confirmation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  related_complaint_id UUID REFERENCES complaints(id),
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  target_type VARCHAR(80),
  target_id VARCHAR(120),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
