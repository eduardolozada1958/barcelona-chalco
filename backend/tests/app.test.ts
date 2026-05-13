import request from 'supertest';
import { createApp } from '../src/app';
import { env } from '../src/config/env';

describe('API HTTP', () => {
  const app = createApp();

  it('GET /health responde OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.env).toBe(env.NODE_ENV);
  });

  it('incluye X-Request-Id en respuestas', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(typeof res.headers['x-request-id']).toBe('string');
  });

  it('404 para rutas desconocidas bajo API', async () => {
    const res = await request(app).get(`${env.API_PREFIX}/ruta-inexistente`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('rechaza JSON inválido con 400', async () => {
    const res = await request(app)
      .post(`${env.API_PREFIX}/auth/login`)
      .set('Content-Type', 'application/json')
      .send('{ no-json');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('validación Zod en login devuelve 422', async () => {
    const res = await request(app)
      .post(`${env.API_PREFIX}/auth/login`)
      .send({ email: 'no-email', password: 'x' });

    expect(res.status).toBe(422);
    expect(res.body.errors?.length).toBeGreaterThan(0);
  });
});
