import { z } from 'zod'

const SlackBotInstallationDbSchema = z.object({
  oauth_data: z.string().nonempty(),
})

export class SlackBotInstallation {
  oauth_data!: string

  constructor(src: Partial<SlackBotInstallation>) {
    Object.assign(this, src)
  }

  isValidForDatabase(): boolean {
    return SlackBotInstallationDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof SlackBotInstallationDbSchema> {
    return SlackBotInstallationDbSchema.parse(this)
  }
}

const SlackChannelDbSchema = z.object({
  url: z.string().url(),
  channel: z.string().optional(),
  channel_id: z.string().optional(),
  configuration_url: z.string().optional(),
})

export class SlackChannel {
  readonly id: string
  url!: string
  channel?: string
  channel_id?: string
  configuration_url?: string

  constructor(id: string, src: Partial<SlackChannel>) {
    Object.assign(this, src)
    this.id = id
  }

  isValidForDatabase(): boolean {
    return SlackChannelDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof SlackChannelDbSchema> {
    return SlackChannelDbSchema.parse(this)
  }
}

/** Bolt Installation.incomingWebhook 保存用 */
export const SlackIncomingWebhookSchema = z
  .object({
    url: z.string().url(),
    channel: z.string().optional(),
    channelId: z.string().optional(),
    channel_id: z.string().optional(),
    configurationUrl: z.string().optional(),
    configuration_url: z.string().optional(),
  })
  .passthrough()

export type SlackIncomingWebhook = z.infer<typeof SlackIncomingWebhookSchema>

export const getIncomingWebhookChannelId = (webhook: SlackIncomingWebhook): string => {
  const channelId = webhook.channelId ?? webhook.channel_id
  if (channelId == null || channelId === '') {
    throw new Error('incomingWebhook.channelId is required')
  }
  return channelId
}
