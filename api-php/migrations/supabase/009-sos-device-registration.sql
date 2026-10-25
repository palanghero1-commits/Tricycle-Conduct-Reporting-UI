CREATE TABLE IF NOT EXISTS sos_devices (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_label VARCHAR(120) NOT NULL DEFAULT 'Android phone',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID PRIMARY KEY,
  client_alert_id VARCHAR(80) NOT NULL,
  student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES sos_devices(id) ON DELETE SET NULL,
  driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RESOLVED','CANCELLED')),
  source VARCHAR(32) NOT NULL DEFAULT 'ONLINE' CHECK (source IN ('ONLINE','OFFLINE_SMS_REPORTED')),
  delivery_status VARCHAR(32) NOT NULL DEFAULT 'DELIVERED' CHECK (delivery_status IN ('DELIVERED','DELAYED_REPORTED')),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  location_accuracy_meters NUMERIC(8, 2),
  started_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sos_alerts_status_started_idx ON sos_alerts(status, started_at);
CREATE INDEX IF NOT EXISTS sos_alerts_user_idx ON sos_alerts(student_user_id);
CREATE INDEX IF NOT EXISTS sos_devices_user_active_idx ON sos_devices(user_id, revoked_at);

-- Add these fields to installations that already created the earlier SOS table.
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS client_alert_id VARCHAR(80);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES sos_devices(id) ON DELETE SET NULL;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS source VARCHAR(32) NOT NULL DEFAULT 'ONLINE';
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(32) NOT NULL DEFAULT 'DELIVERED';
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sos_alerts ALTER COLUMN driver_id DROP NOT NULL;
ALTER TABLE sos_alerts ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE sos_alerts ALTER COLUMN longitude DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sos_alerts_user_client_alert_idx ON sos_alerts(student_user_id, client_alert_id);
