import { z } from 'zod';

const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const phoneSchema = z.object({
  phone: z
    .string()
    .regex(phoneRegex, 'Enter a valid phone number in international format (e.g. +12025551234)'),
});

export const profileSetupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .regex(phoneRegex, 'Enter a valid phone number in international format (e.g. +12025551234)')
    .optional()
    .or(z.literal('')),
});

export const mapAuthError = (error: string): string => {
  const map: Record<string, string> = {
    'Invalid login credentials': 'Incorrect email or password.',
    'Email not confirmed': 'Please verify your email before logging in.',
    'User already registered': 'An account with this email already exists.',
    'Token has expired or is invalid': 'OTP has expired. Please request a new one.',
    'Invalid OTP': 'Incorrect code. Please try again.',
    'Too many requests': 'Too many attempts. Please wait and try again.',
    'Network request failed': 'Network error. Check your connection and try again.',
  };
  for (const key of Object.keys(map)) {
    if (error.includes(key)) return map[key];
  }
  return error || 'Something went wrong. Please try again.';
};

export type SignupForm = z.infer<typeof signupSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type ProfileSetupForm = z.infer<typeof profileSetupSchema>;
