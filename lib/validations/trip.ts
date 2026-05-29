import { z } from 'zod';
import dayjs from 'dayjs';

export const destinationSchema = z.object({
  name: z.string().min(1, 'Destination name is required'),
  place_id: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const tripStep1Schema = z.object({
  name: z.string().min(1, 'Trip name is required').max(60, 'Max 60 characters'),
  destinations: z
    .array(destinationSchema)
    .min(1, 'Add at least one destination'),
});

export const tripStep2Schema = z
  .object({
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
  })
  .refine((d) => !dayjs(d.end_date).isBefore(dayjs(d.start_date)), {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  });

export type DestinationInput = z.infer<typeof destinationSchema>;
export type TripStep1Form = z.infer<typeof tripStep1Schema>;
export type TripStep2Form = z.infer<typeof tripStep2Schema>;
