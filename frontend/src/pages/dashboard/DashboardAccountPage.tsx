import { useAuth } from '@/contexts/AuthContext';
import { TotpSecurityPanel } from '@/components/TotpSecurityPanel';
import { MaterialIcon } from '@/components/MaterialIcon';

export function DashboardAccountPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-stack-lg">
      <header>
        <h1 className="font-display-hero text-headline-lg-mobile md:text-display-hero text-primary tracking-tight">
          Mi cuenta
        </h1>
        <p className="text-on-surface-variant mt-2 font-body-md">
          Seguridad y verificación en dos pasos (opcional).
        </p>
      </header>

      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-stack-md max-w-xl">
        <p className="text-sm text-on-surface-variant mb-1">Sesión actual</p>
        <p className="font-body-lg text-on-surface">{user?.fullName}</p>
        <p className="text-sm text-on-surface-variant">{user?.email}</p>
        <p className="text-xs text-primary mt-2 font-label-caps uppercase">{user?.role}</p>
      </section>

      <div className="max-w-xl">
        <TotpSecurityPanel />
      </div>

      <p className="text-xs text-on-surface-variant max-w-xl flex gap-2">
        <MaterialIcon name="info" size={16} className="shrink-0 mt-0.5" />
        La protección de la base de datos (RLS, buckets privados, API en Render) ya está activa para todos.
        El 2FA solo añade protección extra a tu cuenta personal si alguien obtiene tu contraseña.
      </p>
    </div>
  );
}
