import { encryptTotpSecret, decryptTotpSecret } from '@shared/utils/totp-crypto';

describe('totp-crypto', () => {
  it('cifra y descifra el secreto TOTP', () => {
    const plain = 'JBSWY3DPEHPK3PXP';
    const enc = encryptTotpSecret(plain);
    expect(enc).not.toContain(plain);
    expect(decryptTotpSecret(enc)).toBe(plain);
  });
});
