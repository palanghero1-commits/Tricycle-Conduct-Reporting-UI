ALTER TABLE complaints ADD COLUMN local_report_id VARCHAR(100) NULL AFTER id;
ALTER TABLE complaints ADD UNIQUE INDEX complaints_local_report_unique (student_user_id, local_report_id);
