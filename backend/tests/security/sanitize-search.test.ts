import {
  buildIlikeOrFilter,
  buildPlayerNameIlikeFilter,
  sanitizeIlikeSearchTerm,
} from '../../src/shared/utils/sanitize-search';

describe('sanitize-search (anti-inyección PostgREST)', () => {
  it('elimina comodines y operadores ilike', () => {
    expect(sanitizeIlikeSearchTerm("' OR 1=1--")).toBeUndefined();
    expect(sanitizeIlikeSearchTerm('%,admin')).toBe('admin');
    expect(sanitizeIlikeSearchTerm('%_()')).toBeUndefined();
    expect(sanitizeIlikeSearchTerm('test)evil')).toBe('test evil');
  });

  it('normaliza acentos y permite 2+ letras', () => {
    expect(sanitizeIlikeSearchTerm('Matías')).toBe('matias');
    expect(sanitizeIlikeSearchTerm('mat')).toBe('mat');
    expect(sanitizeIlikeSearchTerm('m')).toBeUndefined();
  });

  it('limita longitud', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeIlikeSearchTerm(long)?.length).toBeLessThanOrEqual(80);
  });

  it('buildIlikeOrFilter no incluye comas arbitrarias del usuario', () => {
    const f = buildIlikeOrFilter(['first_name'], 'normal');
    expect(f).toBe('first_name.ilike.%normal%');
    expect(f.split(',').length).toBe(1);
  });

  it('buildPlayerNameIlikeFilter usa search_key sin acentos', () => {
    const f = buildPlayerNameIlikeFilter('Matías');
    expect(f).toContain('search_key.ilike.%matias%');
  });
});
