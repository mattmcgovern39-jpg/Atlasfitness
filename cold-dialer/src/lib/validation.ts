import { z } from 'zod';
import { DISPOSITIONS, OBJECTIONS, LEAD_STATUSES } from './types';

// Shared field limits. CSVs can contain anything; these caps stop a
// malformed/huge file from bloating the local DB or the UI.
const shortText = z.string().trim().max(200).optional().nullable();
const longText = z.string().trim().max(5000).optional().nullable();

export const LeadInputSchema = z.object({
  first_name: shortText,
  last_name: shortText,
  company: shortText,
  title: shortText,
  phone: z.string().trim().min(3).max(40),
  email: z
    .string()
    .trim()
    .max(320)
    .refine((v) => v === '' || z.string().email().safeParse(v).success, {
      message: 'Invalid email',
    })
    .optional()
    .nullable(),
  address: shortText,
  city: shortText,
  state: shortText,
  postal_code: shortText,
  country: shortText,
  notes: longText,
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  priority: z.number().int().min(0).max(5).optional(),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;

export const LeadUpdateSchema = LeadInputSchema.partial().extend({
  status: z.enum(LEAD_STATUSES).optional(),
  do_not_call: z.boolean().optional(),
  next_action_at: z.string().datetime().optional().nullable(),
});

export const CallInputSchema = z.object({
  lead_id: z.string().uuid(),
  session_id: z.string().uuid().optional().nullable(),
  disposition: z.enum(DISPOSITIONS),
  objection: z.enum(OBJECTIONS).optional().nullable(),
  notes: longText,
  duration_seconds: z.number().int().min(0).max(24 * 60 * 60),
  started_at: z.string().datetime(),
  follow_up_at: z.string().datetime().optional().nullable(),
});

export type CallInput = z.infer<typeof CallInputSchema>;

export const SessionStartSchema = z.object({
  notes: longText,
});

export const ImportRowSchema = z.object({
  first_name: z.string().trim().max(200).optional(),
  last_name: z.string().trim().max(200).optional(),
  company: z.string().trim().max(200).optional(),
  title: z.string().trim().max(200).optional(),
  phone: z.string().trim().min(3).max(40),
  email: z.string().trim().max(320).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(200).optional(),
  state: z.string().trim().max(200).optional(),
  postal_code: z.string().trim().max(200).optional(),
  country: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const ColumnMappingSchema = z.record(z.string(), z.string().nullable());

export const CallingHoursSettingsSchema = z.object({
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(23),
  endMinute: z.number().int().min(0).max(59),
});
