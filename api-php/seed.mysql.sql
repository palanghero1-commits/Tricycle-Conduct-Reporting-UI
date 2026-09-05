USE tricycle_conduct;

INSERT IGNORE INTO users (id, full_name, email, username, password_hash, role) VALUES
('00000000-0000-4000-8000-000000000000', 'Super Administrator', 'superadmin@oldsagay.gov.ph', 'superadmin', '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'SUPERADMIN'),
('11111111-1111-4111-8111-111111111111', 'Demo Student', 'student@sunn.edu.ph', NULL, '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'STUDENT'),
('22222222-2222-4222-8222-222222222222', 'Rogelio D. Santos', 'driver@oldsagay-toda.ph', NULL, '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'DRIVER'),
('33333333-3333-4333-8333-333333333333', 'Authorized Personnel', 'authorized@oldsagay.gov.ph', 'authorized-personnel', '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'AUTHORIZED_PERSONNEL'),
('44444444-4444-4444-8444-444444444444', 'TODA President', 'president@oldsagay-toda.ph', 'toda-president', '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'TODA_PRESIDENT'),
('55555555-5555-4555-8555-555555555555', 'PNP Reviewer', 'pnp@oldsagay.gov.ph', 'pnp-reviewer', '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'PNP');

UPDATE users SET created_by = '00000000-0000-4000-8000-000000000000'
WHERE id IN ('33333333-3333-4333-8333-333333333333', '55555555-5555-4555-8555-555555555555');

UPDATE users SET created_by = '33333333-3333-4333-8333-333333333333'
WHERE id = '44444444-4444-4444-8444-444444444444';

INSERT IGNORE INTO todas (id, name, barangay, city, province, president_user_id)
VALUES (1, 'Old Sagay TODA', 'Old Sagay', 'Sagay City', 'Negros Occidental', '44444444-4444-4444-8444-444444444444');

INSERT IGNORE INTO authorized_personnel (user_id, personnel_type, office_name, position_title) VALUES
('33333333-3333-4333-8333-333333333333', 'BARANGAY_STAFF', 'Barangay Old Sagay', 'Authorized Personnel'),
('55555555-5555-4555-8555-555555555555', 'PNP_REVIEWER', 'Sagay City PNP', 'PNP Reviewer');

INSERT IGNORE INTO students (user_id, student_id, program, year_level, campus)
VALUES ('11111111-1111-4111-8111-111111111111', 'SUNN-2026-0001', 'Capstone Testing Program', '4th year', 'SUNN');

INSERT IGNORE INTO drivers (user_id, toda_id, full_name, driver_code, tricycle_identifier, route_area, account_created_by, account_creation_reason) VALUES
('22222222-2222-4222-8222-222222222222', 1, 'Rogelio D. Santos', 'DRV-OS-4821', 'OS-4821', 'Old Sagay Market loop', '44444444-4444-4444-8444-444444444444', 'TODA_CREATED_NO_PHONE'),
(NULL, 1, 'Maribel A. Cruz', 'DRV-OS-3176', 'OS-3176', 'Old Sagay Campus loop', NULL, 'AUTHORIZED_CREATED'),
(NULL, 1, 'Jonas P. Villanueva', 'DRV-OS-9084', 'OS-9084', 'Old Sagay Riverside loop', NULL, 'AUTHORIZED_CREATED');

INSERT IGNORE INTO complaint_categories (name, description) VALUES
('Overcharging', 'Fare collected differs from the posted or agreed route fare.'),
('Reckless Driving', 'Unsafe speed, sudden stops, or risky vehicle operation.'),
('Refusal to Transport', 'Driver declined a valid route or passenger request.'),
('Discourteous Behavior', 'Disrespectful or inappropriate conduct.'),
('Unsafe Driving', 'Passenger safety concern during the trip.'),
('Vehicle Condition', 'Missing ID, condition, or vehicle safety concern.'),
('Other', 'A concern that does not match another category.');
