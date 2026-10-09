ALTER TABLE complaints ADD COLUMN latitude DECIMAL(10, 7) NULL AFTER location;
ALTER TABLE complaints ADD COLUMN longitude DECIMAL(10, 7) NULL AFTER latitude;
ALTER TABLE complaints ADD COLUMN location_accuracy_meters DECIMAL(8, 2) NULL AFTER longitude;
ALTER TABLE complaints ADD COLUMN location_captured_at DATETIME NULL AFTER location_accuracy_meters;
