import { z } from 'zod';

export const bookingItemSchema = z.object({
  ticket_tier: z.number().int().positive('Invalid ticket tier'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const bookingCreateSchema = z.object({
  event: z.number().int().positive('Event ID is required'),
  items: z.array(bookingItemSchema).min(1, 'Select at least one ticket tier'),
});

export type BookingCreateFormData = z.infer<typeof bookingCreateSchema>;

export const paymentInitiateSchema = z.object({
  provider: z.enum(['ESEWA', 'KHALTI']),
});

export type PaymentInitiateFormData = z.infer<typeof paymentInitiateSchema>;

export const paymentVerifySchema = z.object({
  provider: z.enum(['ESEWA', 'KHALTI']),
  pidx: z.string().optional(),
});

export type PaymentVerifyFormData = z.infer<typeof paymentVerifySchema>;

export const checkInSchema = z.object({
  qr_payload: z.string().min(1, 'QR payload is required'),
});

export type CheckInFormData = z.infer<typeof checkInSchema>;
