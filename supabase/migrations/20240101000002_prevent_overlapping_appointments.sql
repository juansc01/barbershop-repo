-- Migration: Prevent overlapping appointments at database level (concurrency guard)
-- This trigger rejects any new appointment that overlaps with an existing non-cancelled one

CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's any existing non-cancelled appointment that overlaps
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE barber_id = NEW.barber_id
      AND status != 'cancelled'
      AND id != NEW.id
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'SLOT_TAKEN: This time slot overlaps with an existing appointment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT and UPDATE
DROP TRIGGER IF EXISTS prevent_appointment_overlap ON appointments;
CREATE TRIGGER prevent_appointment_overlap
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_overlap();

