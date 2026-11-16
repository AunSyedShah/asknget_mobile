import { z } from 'zod';

/** The app serves customers only. The backend lets seller and staff accounts sign in too; we refuse them. */
export function isCustomerAccount(user: { is_seller?: boolean | null; is_staff?: boolean | null }): boolean {
  return !user.is_seller && !user.is_staff;
}

export const MIN_PASSWORD_LENGTH = 8;

const email = z.string().trim().email('Enter a valid email address.');
const password = z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(1, 'Enter your name.'),
    email,
    phone: z.string().trim().optional(),
    password,
    confirm_password: z.string(),
  })
  .refine((value) => value.password === value.confirm_password, {
    path: ['confirm_password'],
    message: 'The passwords do not match.',
  });

export const resetSchema = z
  .object({
    email,
    code: z.string().trim().min(4, 'Enter the code from your email.'),
    new_password: password,
    confirm_password: z.string(),
  })
  .refine((value) => value.new_password === value.confirm_password, {
    path: ['confirm_password'],
    message: 'The passwords do not match.',
  });

/** Turns a zod failure into one message per field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}
