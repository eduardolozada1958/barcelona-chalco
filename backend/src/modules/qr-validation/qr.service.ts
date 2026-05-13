import { supabaseAdmin } from '@config/database';
import { env } from '@config/env';
import QRCode from 'qrcode';
import { NotFoundError } from '@middlewares/error.middleware';

interface ValidateResult {
  isValid:  boolean;
  player?:  Record<string, unknown>;
}

export class QrService {
  /**
   * Valida un QR token y registra el intento via RPC.
   */
  static async validate(token: string, ip: string | null, userAgent: string | null): Promise<ValidateResult> {
    const { data, error } = await supabaseAdmin.rpc('log_qr_validation', {
      p_qr_token: token,
      p_ip:       ip,
      p_agent:    userAgent,
    });

    if (error) throw new Error('Error al validar QR');

    const result = Array.isArray(data) ? data[0] : data;

    if (!result?.is_valid) {
      return { isValid: false };
    }

    // Obtener credencial pública del jugador
    const { data: player } = await supabaseAdmin
      .from('v_player_public_credential')
      .select('*')
      .eq('id', result.player_id)
      .single();

    return { isValid: true, player: player ?? undefined };
  }

  /**
   * Genera una imagen QR (PNG buffer) para el jugador indicado.
   */
  static async generateImage(playerId: string): Promise<Buffer> {
    const { data: player, error } = await supabaseAdmin
      .from('players')
      .select('id, first_name, last_name, qr_token, is_verified')
      .eq('id', playerId)
      .is('deleted_at', null)
      .single();

    if (error || !player || !player.qr_token) {
      throw new NotFoundError('Jugador no encontrado o sin QR generado');
    }

    const qrUrl = `${env.CORS_ORIGIN}/credencial/${player.qr_token}`;
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
    });

    return qrBuffer;
  }
}
