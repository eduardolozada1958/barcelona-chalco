import { _resetSecurityAlertStateForTests } from '../../src/middlewares/security-alert.middleware';

describe('security-alert middleware', () => {
  beforeEach(() => {
    _resetSecurityAlertStateForTests();
  });

  it('expone reset para tests', () => {
    expect(typeof _resetSecurityAlertStateForTests).toBe('function');
  });
});
