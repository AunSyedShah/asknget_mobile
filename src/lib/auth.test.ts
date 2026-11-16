import { fieldErrors, isCustomerAccount, loginSchema, registerSchema, resetSchema } from './auth';

describe('isCustomerAccount', () => {
  it('accepts a plain customer', () => {
    expect(isCustomerAccount({ is_seller: false, is_staff: false })).toBe(true);
    expect(isCustomerAccount({})).toBe(true);
  });

  it('refuses seller and staff accounts', () => {
    expect(isCustomerAccount({ is_seller: true, is_staff: false })).toBe(false);
    expect(isCustomerAccount({ is_seller: false, is_staff: true })).toBe(false);
    expect(isCustomerAccount({ is_seller: true, is_staff: true })).toBe(false);
  });
});

describe('loginSchema', () => {
  it('needs a valid email and a password', () => {
    const bad = loginSchema.safeParse({ email: 'nope', password: '' });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(Object.keys(fieldErrors(bad.error))).toEqual(['email', 'password']);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
});

describe('registerSchema', () => {
  const base = { full_name: 'Thandi', email: 'thandi@example.co.za', password: 'longenough', confirm_password: 'longenough' };

  it('accepts a complete form', () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a short password and a mismatch on the right fields', () => {
    const short = registerSchema.safeParse({ ...base, password: 'short', confirm_password: 'short' });
    expect(short.success).toBe(false);
    if (!short.success) expect(fieldErrors(short.error).password).toContain('at least 8');

    const mismatch = registerSchema.safeParse({ ...base, confirm_password: 'different1' });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) expect(fieldErrors(mismatch.error).confirm_password).toBe('The passwords do not match.');
  });
});

describe('resetSchema', () => {
  it('needs the code and matching passwords', () => {
    const bad = resetSchema.safeParse({ email: 'a@b.co', code: '12', new_password: 'longenough', confirm_password: 'longenough' });
    expect(bad.success).toBe(false);
    expect(
      resetSchema.safeParse({ email: 'a@b.co', code: '123456', new_password: 'longenough', confirm_password: 'longenough' }).success,
    ).toBe(true);
  });
});
