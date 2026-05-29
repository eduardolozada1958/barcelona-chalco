/** Motivos técnicos guardados en BD → texto para el panel admin. */
export const WHATSAPP_SKIP_REASON_LABELS: Record<string, string> = {
  whatsapp_disabled:     'WhatsApp desactivado en el servidor',
  wa_not_connected:      'WhatsApp del club sin conexión (QR)',
  opted_out:             'Desactivó avisos en Mi perfil',
  no_approved_child:     'Sin hijo vinculado y aprobado',
  email_not_verified:    'Correo sin verificar',
  account_not_active:    'Cuenta no activa',
  no_phone:              'Sin teléfono válido en Mi perfil',
  duplicate_phone:       'Teléfono duplicado (otra cuenta ya recibió)',
  same_as_club_number:   'Teléfono es el chip del club',
  dedup_campaign:        'Ya se envió esta campaña hace poco',
  dedup_body:            'Mismo mensaje enviado hace poco',
  hourly_cap:            'Límite de envíos por hora alcanzado',
  not_in_audience:       'No aplica a esta campaña',
  send_failed:           'Error al enviar',
};

export const WHATSAPP_KIND_LABELS: Record<string, string> = {
  notice:           'Aviso publicado',
  'match:scheduled': 'Partido programado',
  'match:updated':   'Partido actualizado',
  result:           'Resultado publicado',
  leaders:          'Tabla de goleo',
  mvp:              'MVP de la semana',
  gallery:          'Galería publicada',
  'remind:curp':    'Recordatorio vínculo CURP',
  test:             'Mensaje de prueba',
};

export const WHATSAPP_LINK_STATUS_LABELS: Record<string, string> = {
  linked:          'Hijo(s) aprobado(s)',
  pending:         'Solicitud pendiente',
  unlinked:        'Sin vínculo CURP',
  rejected_only:   'Solo solicitudes rechazadas',
  unknown:         '—',
};

export function skipReasonLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return WHATSAPP_SKIP_REASON_LABELS[code] ?? code;
}
