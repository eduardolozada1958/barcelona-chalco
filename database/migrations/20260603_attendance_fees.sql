-- Asistencia semanal + cuotas (registro / mensualidad) + bloqueo de padres por mora.

ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_hold boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN users.payment_hold IS 'true = padre no puede entrar hasta regularizar registro o mensualidad';

ALTER TABLE players ADD COLUMN IF NOT EXISTS registration_paid boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN players.registration_paid IS 'Registro / alta pagada (una vez por jugador)';

CREATE TABLE IF NOT EXISTS player_monthly_fees (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  period_month  date NOT NULL,
  monthly_fee_paid boolean NOT NULL DEFAULT false,
  notes         text,
  updated_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_player_monthly_fees_period ON player_monthly_fees (period_month);

CREATE TABLE IF NOT EXISTS attendance_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  present         boolean NOT NULL DEFAULT false,
  notes           text,
  updated_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records (attendance_date);
