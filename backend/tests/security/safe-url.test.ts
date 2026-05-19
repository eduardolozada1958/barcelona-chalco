import { sanitizeHttpUrl } from '../../src/shared/utils/safe-url';

describe('safe-url', () => {
  it('acepta http y https', () => {
    expect(sanitizeHttpUrl('https://barcelona-chalco.pages.dev/verify?x=1')).toContain('https://');
  });

  it('rechaza javascript y data', () => {
    expect(sanitizeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeHttpUrl('data:text/html,<script>')).toBeNull();
  });
});
