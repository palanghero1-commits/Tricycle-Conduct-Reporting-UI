CREATE DATABASE IF NOT EXISTS tricycle_conduct CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tricycle_conduct;

CREATE TABLE todas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  barangay VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  province VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(180) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role ENUM('STUDENT','DRIVER','TODA_OFFICER','ADMIN','PNP') NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  contact_number VARCHAR(60),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX users_role_idx (role)
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  student_id VARCHAR(80) NOT NULL UNIQUE,
  program VARCHAR(180),
  year_level VARCHAR(40),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT students_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36),
  toda_id INT NOT NULL,
  full_name VARCHAR(180) NOT NULL,
  driver_code VARCHAR(80) NOT NULL UNIQUE,
  tricycle_identifier VARCHAR(80) NOT NULL UNIQUE,
  plate_number VARCHAR(80),
  route_area VARCHAR(180),
  contact_number VARCHAR(60),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT drivers_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT drivers_toda_fk FOREIGN KEY (toda_id) REFERENCES todas(id),
  INDEX drivers_toda_idx (toda_id)
);

CREATE TABLE complaint_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
  id CHAR(36) PRIMARY KEY,
  reference_number VARCHAR(40) NOT NULL UNIQUE,
  student_user_id CHAR(36) NOT NULL,
  driver_id INT NOT NULL,
  category_id INT NOT NULL,
  status ENUM('SUBMITTED','RECEIVED','UNDER_REVIEW','VERIFIED','REFERRED','RESOLVED','CLOSED') NOT NULL DEFAULT 'SUBMITTED',
  incident_date DATE NOT NULL,
  incident_time VARCHAR(8) NOT NULL,
  location VARCHAR(240) NOT NULL,
  description TEXT NOT NULL,
  review_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT complaints_student_fk FOREIGN KEY (student_user_id) REFERENCES users(id),
  CONSTRAINT complaints_driver_fk FOREIGN KEY (driver_id) REFERENCES drivers(id),
  CONSTRAINT complaints_category_fk FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
  INDEX complaints_student_idx (student_user_id),
  INDEX complaints_driver_idx (driver_id),
  INDEX complaints_status_idx (status)
);

CREATE TABLE complaint_attachments (
  id CHAR(36) PRIMARY KEY,
  complaint_id CHAR(36) NOT NULL,
  original_name VARCHAR(240) NOT NULL,
  stored_name VARCHAR(260) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes INT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attachments_complaint_fk FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  CONSTRAINT attachments_user_fk FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE complaint_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id CHAR(36) NOT NULL,
  previous_status ENUM('SUBMITTED','RECEIVED','UNDER_REVIEW','VERIFIED','REFERRED','RESOLVED','CLOSED'),
  new_status ENUM('SUBMITTED','RECEIVED','UNDER_REVIEW','VERIFIED','REFERRED','RESOLVED','CLOSED') NOT NULL,
  changed_by CHAR(36),
  remarks TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT history_complaint_fk FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  CONSTRAINT history_user_fk FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE complaint_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id CHAR(36) NOT NULL,
  action_type VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  action_taken_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT actions_complaint_fk FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  CONSTRAINT actions_user_fk FOREIGN KEY (action_taken_by) REFERENCES users(id)
);

CREATE TABLE violations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  complaint_id CHAR(36) NOT NULL,
  violation_category VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  confirmed_by CHAR(36) NOT NULL,
  remarks TEXT,
  confirmation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT violations_driver_fk FOREIGN KEY (driver_id) REFERENCES drivers(id),
  CONSTRAINT violations_complaint_fk FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  CONSTRAINT violations_user_fk FOREIGN KEY (confirmed_by) REFERENCES users(id)
);

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  recipient_user_id CHAR(36) NOT NULL,
  type VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  related_complaint_id CHAR(36),
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_user_fk FOREIGN KEY (recipient_user_id) REFERENCES users(id),
  CONSTRAINT notifications_complaint_fk FOREIGN KEY (related_complaint_id) REFERENCES complaints(id)
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36),
  action VARCHAR(120) NOT NULL,
  target_type VARCHAR(80),
  target_id VARCHAR(120),
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);
