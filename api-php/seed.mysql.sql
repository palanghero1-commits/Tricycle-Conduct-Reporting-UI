USE tricycle_conduct;

INSERT IGNORE INTO todas (id, name, barangay, city, province)
VALUES (1, 'Old Sagay TODA', 'Old Sagay', 'Sagay City', 'Negros Occidental');

INSERT IGNORE INTO complaint_categories (name) VALUES
('Overcharging'),
('Reckless Driving'),
('Refusal to Transport'),
('Discourteous Behavior'),
('Unsafe Driving'),
('Other');

INSERT IGNORE INTO drivers (toda_id, full_name, driver_code, tricycle_identifier, route_area) VALUES
(1, 'Rogelio D. Santos', 'DRV-OS-4821', 'OS-4821', 'Old Sagay Market loop'),
(1, 'Maribel A. Cruz', 'DRV-OS-3176', 'OS-3176', 'Old Sagay Campus loop'),
(1, 'Jonas P. Villanueva', 'DRV-OS-9084', 'OS-9084', 'Old Sagay Riverside loop');

INSERT IGNORE INTO users (id, full_name, email, password_hash, role) VALUES
('11111111-1111-4111-8111-111111111111', 'Demo Student', 'student@sunn.edu.ph', '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'STUDENT'),
('22222222-2222-4222-8222-222222222222', 'Rogelio D. Santos', 'driver@oldsagay-toda.ph', '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'DRIVER'),
('33333333-3333-4333-8333-333333333333', 'Admin User', 'admin@oldsagay.gov.ph', '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'ADMIN'),
('44444444-4444-4444-8444-444444444444', 'TODA Officer', 'officer@oldsagay.gov.ph', '$2y$12$MMagkSwqisqqbPxN22mJ1ebrEQCmkwh0/x072JjSQQFiSI1jhnMo.', 'TODA_OFFICER');

INSERT IGNORE INTO students (user_id, student_id, program, year_level)
VALUES ('11111111-1111-4111-8111-111111111111', 'SUNN-2026-0001', 'Capstone Testing Program', '4th year');

UPDATE drivers
SET user_id = '22222222-2222-4222-8222-222222222222'
WHERE driver_code = 'DRV-OS-4821';
