import { z } from 'zod'

export const ClientErrorAppSchema = z.enum(['user', 'partner'])

export const ZodIssueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  code: z.string(),
  message: z.string(),
})

export const ClientErrorReportRequestSchema = z.object({
  app: ClientErrorAppSchema,
  error_type: z.string().max(100),
  message: z.string().max(500),
  stack: z.string().max(4000).nullish(),
  zod_issues: z.array(ZodIssueSchema).max(20).nullish(),
  route: z.string().max(500),
  component_info: z.string().max(200).nullish(),
  document_path: z.string().max(300).nullish(),
  user_id: z.string().max(128).nullish(),
  user_agent: z.string().max(300).nullish(),
  fingerprint: z.string().max(64),
  severity: z.enum(['error', 'warn']).default('error'),
})

export type ClientErrorReportRequest = z.infer<typeof ClientErrorReportRequestSchema>

export const ClientErrorReportResponseSchema = z.object({
  accepted: z.boolean(),
})

export type ClientErrorReportResponse = z.infer<typeof ClientErrorReportResponseSchema>
