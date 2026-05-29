import {
  markWhatsAppBodySent,
  markWhatsAppSent,
  shouldSkipWhatsAppByBody,
  shouldSkipWhatsAppSend,
} from '../src/modules/whatsapp/whatsapp-dedup';

describe('whatsapp-dedup', () => {
  const jid = '5215512345678@s.whatsapp.net';

  it('omite reenvío de la misma campaña en ventana corta', () => {
    expect(shouldSkipWhatsAppSend(jid, 'notice', 'n1')).toBe(false);
    markWhatsAppSent(jid, 'notice', 'n1');
    expect(shouldSkipWhatsAppSend(jid, 'notice', 'n1')).toBe(true);
    expect(shouldSkipWhatsAppSend(jid, 'notice', 'n2')).toBe(false);
  });

  it('omite el mismo cuerpo de mensaje en ventana corta', () => {
    const body = 'Mensaje de prueba único';
    expect(shouldSkipWhatsAppByBody(jid, body)).toBe(false);
    markWhatsAppBodySent(jid, body);
    expect(shouldSkipWhatsAppByBody(jid, body)).toBe(true);
  });
});
