jest.mock('@config/database', () => ({
  supabaseAdmin: {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

import { recordFailedLogin } from '../../src/modules/auth/login-lockout';

describe('login anti-enumeración', () => {
  it('recordFailedLogin no revela si el email existe', async () => {
    await expect(recordFailedLogin('user-id', 0)).rejects.toMatchObject({
      message: expect.stringMatching(/correo o contraseña/i),
    });
  });
});
