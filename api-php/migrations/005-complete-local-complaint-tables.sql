CREATE TABLE IF NOT EXISTS complaint_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id CHAR(36) PRIMARY KEY,
  reference_number VARCHAR(40) NOT NULL UNIQUE,
  student_user_id CHAR(36),
  driver_id INT NOT NULL,
  category_id INT NOT NULL,
  status ENUM('SUBMITTED','RECEIVED','UNDER_REVIEW','VERIFIED','REFERRED','RESOLVED','CLOSED') NOT NULL DEFAULT 'SUBMITTED',
  incident_date DATE NOT NULL,
  incident_time VARCHAR(8) NOT NULL,
  location VARCHAR(240) NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  location_accuracy_meters DECIMAL(8, 2) NULL,
  location_captured_at DATETIME NULL,
  description TEXT NOT NULL,
  review_notes TEXT,
  assigned_to CHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT complaints_student_fk FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT complaints_driver_fk FOREIGN KEY (driver_id) REFERENCES drivers(id),
  CONSTRAINT complaints_category_fk FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
  CONSTRAINT complaints_assignee_fk FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX complaints_student_idx (student_user_id),
  INDEX complaints_driver_idx (driver_id),
  INDEX complaints_status_idx (status)
);

CREATE TABLE IF NOT EXISTS complaint_attachments (
  id CHAR(36) PRIMARY KEY,
  complaint_id CHAR(36) NOT NULL,
  original_name VARCHAR(240) NOT NULL,
  stored_name VARCHAR(260) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes INT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by CHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attachments_complaint_fk FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  CONSTRAINT attachments_user_fk FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id CHAR(36) NOT NULL,
  previous_status ENUM('SUBMITTED','RECEIVED','UNDER_REVIEW','VERIFIED','REFERRED','RESOLVED','CLOSED'),
  new_status ENUM('SUBMITTED','RECEIVED','UNDER_REVIEW','VERIFIED','REFERRED','RESOLVED','CLOSED') NOT NULL,
  changed_by CHAR(36),
  remarks TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT history_complaint_fk FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  CONSTRAINT history_user_fk FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS complaint_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id CHAR(36) NOT NULL,
  action_type VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  action_taken_by CHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT actions_complaint_fk FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  CONSTRAINT actions_user_fk FOREIGN KEY (action_taken_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS violations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  complaint_id CHAR(36) NOT NULL,
  violation_category VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  confirmed_by CHAR(36),
  remarks TEXT,
  confirmation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT violations_driver_fk FOREIGN KEY (driver_id) REFERENCES drivers(id),
  CONSTRAINT violations_complaint_fk FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  CONSTRAINT violations_user_fk FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  recipient_user_id CHAR(36) NOT NULL,
  type VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  related_complaint_id CHAR(36),
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_user_fk FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_complaint_fk FOREIGN KEY (related_complaint_id) REFERENCES complaints(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36),
  action VARCHAR(120) NOT NULL,
  target_type VARCHAR(80),
  target_id VARCHAR(120),
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
