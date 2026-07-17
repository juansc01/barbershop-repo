-- Migration: Add business_schedule setting for editable landing page info
-- Run this in Supabase SQL Editor

-- Update business contact info with current values
INSERT INTO settings (key, value) VALUES
  ('business_schedule', '[{"name":"Lunes","open":true,"start":"09:00","end":"15:00"},{"name":"Martes","open":true,"start":"09:00","end":"15:00"},{"name":"Miércoles","open":true,"start":"09:00","end":"15:00"},{"name":"Jueves","open":true,"start":"09:00","end":"15:00"},{"name":"Viernes","open":true,"start":"09:00","end":"15:00"},{"name":"Sábado","open":false,"start":"09:00","end":"14:00"},{"name":"Domingo","open":false,"start":"09:00","end":"14:00"}]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update phone, email, address with actual values
UPDATE settings SET value = '"666 999 212"' WHERE key = 'business_phone';
UPDATE settings SET value = '"nacho.titobarber@gmail.com"' WHERE key = 'business_email';
UPDATE settings SET value = '"Calle San Adolfo, Número 4, 3er piso"' WHERE key = 'business_address';

