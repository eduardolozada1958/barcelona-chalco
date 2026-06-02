import type { AuthenticatedUser } from '../../src/shared/types';
import {
  getCachedUser,
  invalidateCachedUser,
  setCachedUser,
} from '../../src/shared/utils/user-cache';

const user: AuthenticatedUser = {
  id:       'u1',
  email:    'a@b.com',
  role:     'parent',
  fullName: 'Test',
};

describe('user-cache seguridad', () => {
  beforeEach(() => {
    invalidateCachedUser('u1');
  });

  it('rechaza padre con payment_hold en caché', () => {
    setCachedUser('u1', user, { status: 'active', paymentHold: true });
    expect(getCachedUser('u1')).toBeNull();
  });

  it('rechaza usuario inactivo en caché', () => {
    setCachedUser('u1', user, { status: 'inactive', paymentHold: false });
    expect(getCachedUser('u1')).toBeNull();
  });

  it('devuelve usuario activo sin hold', () => {
    setCachedUser('u1', user, { status: 'active', paymentHold: false });
    expect(getCachedUser('u1')).toEqual(user);
  });

  it('invalidateCachedUser limpia entrada', () => {
    setCachedUser('u1', user, { status: 'active', paymentHold: false });
    invalidateCachedUser('u1');
    expect(getCachedUser('u1')).toBeNull();
  });
});
