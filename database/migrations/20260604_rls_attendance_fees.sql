-- RLS en tablas confidenciales de asistencia y cuotas (solo backend con service_role).

ALTER TABLE player_monthly_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_anon_player_monthly_fees" ON player_monthly_fees;
CREATE POLICY "deny_anon_player_monthly_fees"
  ON player_monthly_fees FOR ALL TO anon
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_auth_player_monthly_fees" ON player_monthly_fees;
CREATE POLICY "deny_auth_player_monthly_fees"
  ON player_monthly_fees FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_attendance_records" ON attendance_records;
CREATE POLICY "deny_anon_attendance_records"
  ON attendance_records FOR ALL TO anon
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_auth_attendance_records" ON attendance_records;
CREATE POLICY "deny_auth_attendance_records"
  ON attendance_records FOR ALL TO authenticated
  USING (false) WITH CHECK (false);
