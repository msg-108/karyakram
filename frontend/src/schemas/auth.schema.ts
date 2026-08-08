import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerUserSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(150, 'Username cannot exceed 150 characters')
      .regex(/^[-a-zA-Z0-9_.]+$/, 'Letters, digits, dot, underscore, hyphen only'),
    email: z.string().email('Invalid email address'),
    first_name: z.string().min(1, 'First name is required').max(150),
    last_name: z.string().min(1, 'Last name is required').max(150),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  });

export type RegisterUserFormData = z.infer<typeof registerUserSchema>;

export const registerOrganizerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(150)
      .regex(/^[-a-zA-Z0-9_.]+$/, 'Letters, digits, dot, underscore, hyphen only'),
    email: z.string().email('Invalid email address'),
    first_name: z.string().min(1, 'First name is required').max(150),
    last_name: z.string().min(1, 'Last name is required').max(150),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string().min(1, 'Please confirm your password'),
    organization_name: z.string().min(1, 'Organization name is required').max(255),
    organization_description: z.string().optional(),
    website_url: z.string().url('Invalid URL format').or(z.literal('')).optional(),
    citizenship_number: z
      .string()
      .min(1, 'Citizenship number is required')
      .max(150)
      .regex(/^(?:\d{1,4}[-/\s]?){2,4}\d{1,7}$|^\d{5,16}$/, "Enter a valid Nepal citizenship number (e.g. '27-01-75-01234')"),
    pan_number: z
      .string()
      .min(1, 'PAN number is required')
      .regex(/^\d{9}$/, 'PAN number must be exactly 9 digits'),
    bank_name: z.string().min(1, 'Bank name is required').max(255),
    bank_account_number: z
      .string()
      .min(1, 'Bank account number is required')
      .regex(/^[A-Za-z0-9]{8,20}$/, 'Enter a valid Nepal bank account number (8 to 20 digits)'),
    citizenship_document: z.custom<File>((val) => val instanceof File, 'Citizenship document is required'),
    pan_document: z.custom<File>((val) => val instanceof File, 'PAN document is required'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  });

export type RegisterOrganizerFormData = z.infer<typeof registerOrganizerSchema>;

export const otpVerifySchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export type OTPVerifyFormData = z.infer<typeof otpVerifySchema>;

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResendOtpFormData = z.infer<typeof resendOtpSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    code: z.string().length(6, 'Verification code must be 6 digits'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    new_password_confirm: z.string().min(1, 'Please confirm new password'),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: 'Passwords do not match',
    path: ['new_password_confirm'],
  });

export type PasswordResetConfirmFormData = z.infer<typeof passwordResetConfirmSchema>;
