-- Seed data for Tito's Barber Shop

-- Insert initial barber: Nacho
INSERT INTO barbers (name, photo_url, color, active, bio) VALUES
('Nacho', 'PLACEHOLDER_IMAGE_DESCRIPCION: Fotografía del peluquero Nacho', '#6366f1', true, 'Barbero profesional con años de experiencia');

-- Insert initial services
INSERT INTO services (name, description, duration, price, color, active, sort_order) VALUES
('Corte y peinado', 'Corte de pelo profesional con peinado incluido', 45, 10.00, '#6366f1', true, 1),
('Barba (Solo Barba)', 'Arreglo y perfilado de barba profesional', 20, 5.00, '#8b5cf6', true, 2),
('Corte y Barba', 'Servicio completo de corte de pelo y arreglo de barba', 45, 12.00, '#ec4899', true, 3);

-- Assign all services to Nacho
INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id FROM barbers b, services s WHERE b.name = 'Nacho';

-- Insert working hours for Nacho (Monday=0 to Friday=4)
INSERT INTO working_hours (barber_id, day_of_week, start_time, end_time, is_working)
SELECT b.id, d.day, '09:00'::TIME, '15:00'::TIME, true
FROM barbers b, (VALUES (0),(1),(2),(3),(4)) AS d(day)
WHERE b.name = 'Nacho';

-- Saturday and Sunday closed
INSERT INTO working_hours (barber_id, day_of_week, start_time, end_time, is_working)
SELECT b.id, d.day, '09:00'::TIME, '15:00'::TIME, false
FROM barbers b, (VALUES (5),(6)) AS d(day)
WHERE b.name = 'Nacho';

-- Insert settings
INSERT INTO settings (key, value) VALUES
('business_name', '"Tito''s Barber Shop"'),
('business_phone', '""'),
('business_email', '""'),
('business_address', '""'),
('slot_interval', '15'),
('allow_online_booking', 'true');

