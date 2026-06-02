import { signAccessToken, verifyAccessTokenPayload } from '../../src/shared/utils/jwt-secrets';
import type { JwtPayload } from '../../src/shared/types';

describe('jwt-secrets', () => {
  const payload: JwtPayload = {
    sub:   '00000000-0000-4000-8000-000000000001',
    email: 'test@example.com',
    role:  'admin',
  };

  it('firma y verifica access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessTokenPayload<JwtPayload>(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
  });
});
