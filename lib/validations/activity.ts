import { z } from 'zod';
import { ActivityIcon } from '@/constants/enums';

export const activityLinkSchema = z.object({
  title: z.string().min(1, 'Link label is required'),
  url: z.string().url('Must be a valid URL'),
});

export const activitySchema = z.object({
  title: z.string().min(1, 'Activity name is required'),
  start_time: z.string().min(1, 'Time is required'),
  icon: z.nativeEnum(ActivityIcon),
  location_name: z.string().optional(),
  place_id: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().optional(),
  links: z.array(activityLinkSchema),
});

export type ActivityForm = z.infer<typeof activitySchema>;
export type ActivityLinkInput = z.infer<typeof activityLinkSchema>;
