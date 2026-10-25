CREATE TABLE IF NOT EXISTS sos_devices (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  device_label VARCHAR(120) NOT NULL DEFAULT 'Android phone',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  CONSTRAINT sos_devices_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX sos_devices_user_active_idx (user_id, revoked_at)
);

-- Apply once to databases that already ran migrations/004-sos-alerts.sql.
ALTER TABLE sos_alerts MODIFY driver_id INT NULL;
ALTER TABLE sos_alerts MODIFY latitude DECIMAL(10, 7) NULL;
ALTER TABLE sos_alerts MODIFY longitude DECIMAL(10, 7) NULL;
ALTER TABLE sos_alerts ADD COLUMN client_alert_id VARCHAR(80) NULL;
ALTER TABLE sos_alerts ADD COLUMN device_id CHAR(36) NULL;
ALTER TABLE sos_alerts ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'ONLINE';
ALTER TABLE sos_alerts ADD COLUMN delivery_status VARCHAR(32) NOT NULL DEFAULT 'DELIVERED';
ALTER TABLE sos_alerts ADD COLUMN received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sos_alerts ADD COLUMN acknowledged_at DATETIME NULL;
ALTER TABLE sos_alerts ADD COLUMN acknowledged_by CHAR(36) NULL;
ALTER TABLE sos_alerts ADD CONSTRAINT sos_alerts_ack_user_fk FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sos_alerts ADD CONSTRAINT sos_alerts_device_fk FOREIGN KEY (device_id) REFERENCES sos_devices(id) ON DELETE SET NULL;
ALTER TABLE sos_alerts ADD UNIQUE KEY sos_alerts_user_client_id_unique (student_user_id, client_alert_id);
