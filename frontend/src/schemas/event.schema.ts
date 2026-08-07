import { z } from 'zod';

export const ticketTierInputSchema = z.object({
  name: z.string().min(1, 'Tier name is required').max(150),
  description: z.string().optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid amount (e.g. 500 or 500.00)'),
  quantity: z.number().int('Must be a whole number').positive('Quantity must be greater than 0'),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export type TicketTierInputData = z.infer<typeof ticketTierInputSchema>;

export const createEventSchema = z
  .object({
    title: z.string().min(1, 'Event title is required').max(255),
    short_description: z
      .string()
      .min(1, 'Short description is required')
      .max(300, 'Cannot exceed 300 characters'),
    description: z.string().min(1, 'Full description is required'),
    terms_and_conditions: z.string().optional(),
    category: z.number().int().positive('Category selection is required'),
    venue: z.string().min(1, 'Venue name is required').max(255),
    address: z.string().min(1, 'Address is required').max(500),
    city: z.string().min(1, 'City is required').max(150),
    district: z.string().max(150).optional(),
    province: z.string().max(150).optional(),

    start_datetime: z.string().min(1, 'Start date and time is required'),
    end_datetime: z.string().min(1, 'End date and time is required'),
    registration_deadline: z.string().optional().nullable(),
    capacity: z.number().int().min(0, 'Capacity cannot be negative'),
    visibility: z.enum(['PUBLIC', 'UNLISTED']),
    banner: z.custom<File>().optional().nullable(),
    ticket_tiers: z
      .array(ticketTierInputSchema)
      .min(1, 'At least one ticket tier is required'),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_datetime);
      const end = new Date(data.end_datetime);
      return end > start;
    },
    {
      message: 'End date/time must be after start date/time',
      path: ['end_datetime'],
    }
  );

export type CreateEventFormData = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    title: z.string().min(1, 'Event title is required').max(255),
    short_description: z
      .string()
      .min(1, 'Short description is required')
      .max(300, 'Cannot exceed 300 characters'),
    description: z.string().min(1, 'Full description is required'),
    terms_and_conditions: z.string().optional(),
    category: z.number().int().positive('Category selection is required'),
    venue: z.string().min(1, 'Venue name is required').max(255),
    address: z.string().min(1, 'Address is required').max(500),
    city: z.string().min(1, 'City is required').max(150),
    district: z.string().max(150).optional(),
    province: z.string().max(150).optional(),
    start_datetime: z.string().min(1, 'Start date and time is required'),
    end_datetime: z.string().min(1, 'End date and time is required'),
    registration_deadline: z.string().optional().nullable(),
    capacity: z.number().int().min(0, 'Capacity cannot be negative'),
    visibility: z.enum(['PUBLIC', 'UNLISTED']),
    banner: z.custom<File>().optional().nullable(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_datetime);
      const end = new Date(data.end_datetime);
      return end > start;
    },
    {
      message: 'End date/time must be after start date/time',
      path: ['end_datetime'],
    }
  );

export type UpdateEventFormData = z.infer<typeof updateEventSchema>;

export const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export type ApprovalActionFormData = z.infer<typeof approvalActionSchema>;
