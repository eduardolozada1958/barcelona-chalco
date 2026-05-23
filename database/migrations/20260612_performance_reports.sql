-- Análisis de rendimiento (informes por categoría / fecha, entradas por jugador).

CREATE TABLE IF NOT EXISTS public.performance_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'General',
  report_date     DATE NOT NULL,
  entries         JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_performance_reports_published
  ON public.performance_reports (report_date DESC, published_at DESC)
  WHERE is_published = TRUE AND deleted_at IS NULL;
