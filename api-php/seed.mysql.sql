USE tricycle_conduct;

INSERT IGNORE INTO users (id, full_name, email, username, password_hash, role) VALUES
('00000000-0000-4000-8000-000000000000', 'Super Administrator', 'superadmin@oldsagay.gov.ph', 'superadmin', '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'SUPERADMIN');

INSERT IGNORE INTO todas (id, name, barangay, city, province, president_user_id)
VALUES (1, 'Old Sagay TODA', 'Old Sagay', 'Sagay City', 'Negros Occidental', NULL);

INSERT IGNORE INTO complaint_categories (name, description) VALUES
('Overcharging', 'Fare collected differs from the posted or agreed route fare.'),
('Reckless Driving', 'Unsafe speed, sudden stops, or risky vehicle operation.'),
('Refusal to Transport', 'Driver declined a valid route or passenger request.'),
('Discourteous Behavior', 'Disrespectful or inappropriate conduct.'),
('Unsafe Driving', 'Passenger safety concern during the trip.'),
('Vehicle Condition', 'Missing ID, condition, or vehicle safety concern.'),
('Other', 'A concern that does not match another category.');
