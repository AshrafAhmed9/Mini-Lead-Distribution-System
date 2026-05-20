import { z } from 'zod'

export const CreateLeadSchema = z.object({
  phone: z.string().trim().min(7, 'Phone number too short').max(15).regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format'),
  service_id: z.coerce.number().int().min(1).max(3),
  customer_name: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).optional(),
})

export const WebhookLeadSchema = z.object({
  event_id: z.string().uuid('event_id must be a valid UUID'),
  phone: z.string().trim().min(7).max(15).regex(/^\+?[\d\s\-()]+$/),
  service_id: z.coerce.number().int().min(1).max(3),
  customer_name: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).optional(),
})

export const ResetQuotaSchema = z.object({
  event_id: z.string().uuid('event_id must be a valid UUID'),
  provider_id: z.coerce.number().int().min(1).max(8).optional(),
})

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>
export type WebhookLeadInput = z.infer<typeof WebhookLeadSchema>
export type ResetQuotaInput = z.infer<typeof ResetQuotaSchema>
