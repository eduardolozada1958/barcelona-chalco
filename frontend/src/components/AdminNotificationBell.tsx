import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { pendingLinkRequestsCount } from '@/api/parents';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useAuth } from '@/contexts/AuthContext';

export function AdminNotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 'admin' || user?.role === 'coach';

  const q = useQuery({
    queryKey: ['link-requests-pending-count'],
    queryFn: pendingLinkRequestsCount,
    enabled: isStaff,
    refetchInterval: 45_000,
    staleTime: 20_000,
  });

  if (!isStaff) return null;

  const count = q.data?.data?.count ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate('/dashboard/link-requests')}
      className="relative p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-variant/40 transition-colors touch-manipulation"
      title={
        count > 0
          ? `${count} solicitud(es) de vínculo pendiente(s). Ir a Vínculos padres.`
          : 'Sin solicitudes de vínculo pendientes'
      }
      aria-label={count > 0 ? `${count} solicitudes de vínculo pendientes` : 'Notificaciones'}
    >
      <MaterialIcon name="notifications" size={24} />
      {count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-[10px] font-bold text-white flex items-center justify-center leading-none">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  );
}
