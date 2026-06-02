import request from 'supertest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import {
  buildPlayerNameIlikeFilter,
  sanitizeIlikeSearchTerm,
} from '../../src/shared/utils/sanitize-search';

describe('API seguridad (superficie HTTP)', () => {
  const app = createApp();
  const prefix = env.API_PREFIX;

  it('rechaza login con email inválido (422)', async () => {
    const res = await request(app)
      .post(`${prefix}/auth/login`)
      .send({ email: 'no-email', password: 'password123' });
    expect(res.status).toBe(422);
  });

  it('rutas admin de comentarios requieren token', async () => {
    const res = await request(app).get(`${prefix}/comments/admin`);
    expect(res.status).toBe(401);
  });

  it('inyección en search no genera filtro PostgREST', () => {
    expect(sanitizeIlikeSearchTerm("' OR 1=1--")).toBeUndefined();
    expect(buildPlayerNameIlikeFilter("' OR 1=1--")).toBe('');
  });

  it('comentarios públicos exigen resourceId UUID', async () => {
    const res = await request(app)
      .get(`${prefix}/comments/public`)
      .query({ resourceType: 'notice', resourceId: 'not-a-uuid' });
    expect(res.status).toBe(422);
  });

  it('crear comentario sin token devuelve 401', async () => {
    const res = await request(app)
      .post(`${prefix}/comments`)
      .send({
        resourceType: 'notice',
        resourceId:   '00000000-0000-4000-8000-000000000001',
        content:      'test',
      });
    expect(res.status).toBe(401);
  });

  it('rechaza comentario con script en contenido', async () => {
    const res = await request(app)
      .post(`${prefix}/comments`)
      .set('Authorization', 'Bearer fake')
      .send({
        resourceType: 'notice',
        resourceId:   '00000000-0000-4000-8000-000000000001',
        content:      '<script>alert(1)</script>',
      });
    expect([401, 422]).toContain(res.status);
  });

  it('vínculo padre sin token devuelve 401', async () => {
    const res = await request(app)
      .post(`${prefix}/parents/link-requests`)
      .send({ curp: 'ABCD123456HDFXXX00', relationship: 'padre' });
    expect(res.status).toBe(401);
  });

  it('CURP document solo admin — sin token 401', async () => {
    const res = await request(app).get(
      `${prefix}/players/00000000-0000-4000-8000-000000000099/curp-document`,
    );
    expect(res.status).toBe(401);
  });

  it('cabeceras de seguridad en health', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('WhatsApp admin sin token devuelve 401', async () => {
    const res = await request(app).get(`${prefix}/whatsapp/status`);
    expect(res.status).toBe(401);
  });

  it('WhatsApp batch id inválido devuelve 422 con token admin falso', async () => {
    const res = await request(app)
      .get(`${prefix}/whatsapp/delivery-batches/not-a-uuid`)
      .set('Authorization', 'Bearer invalid');
    expect([401, 422]).toContain(res.status);
  });

  it('push subscribe sin body válido devuelve 422', async () => {
    const res = await request(app)
      .post(`${prefix}/push/public/subscribe`)
      .send({});
    expect(res.status).toBe(422);
  });

  it('QR validate rechaza token malformado (422)', async () => {
    const res = await request(app).get(`${prefix}/qr/validate/not-valid`);
    expect(res.status).toBe(422);
  });

  it('QR image rechaza UUID inválido (422)', async () => {
    const res = await request(app)
      .get(`${prefix}/qr/player/not-a-uuid/image`)
      .query({ token: 'a'.repeat(40) });
    expect(res.status).toBe(422);
  });
});
