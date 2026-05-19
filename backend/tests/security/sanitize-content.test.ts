import {
  containsDangerousTextPatterns,
  sanitizePlainText,
} from '../../src/shared/utils/sanitize-content';

describe('sanitize-content (anti-XSS almacenado)', () => {
  it('elimina etiquetas HTML', () => {
    expect(sanitizePlainText('<script>alert(1)</script>hola', 100)).toBe('alert(1)hola');
    expect(sanitizePlainText('<b>ok</b>', 100)).toBe('ok');
  });

  it('detecta patrones peligrosos', () => {
    expect(containsDangerousTextPatterns('javascript:alert(1)')).toBe(true);
    expect(containsDangerousTextPatterns('<script')).toBe(true);
    expect(containsDangerousTextPatterns('onclick=evil()')).toBe(true);
    expect(containsDangerousTextPatterns('Buenas tardes')).toBe(false);
  });
});
