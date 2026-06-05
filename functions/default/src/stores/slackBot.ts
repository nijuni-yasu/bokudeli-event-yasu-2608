import {
  DocumentReference,
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import {
  SlackBotInstallation,
  SlackChannel,
  SlackIncomingWebhookSchema,
  getIncomingWebhookChannelId,
  type SlackIncomingWebhook,
} from '@shokujii/common/schemas/SlackBot.js'
import { CommunityBot } from '@shokujii/common/schemas/CommunityBot.js'

const slackBotInstallationConverter: FirestoreDataConverter<SlackBotInstallation> = {
  toFirestore(installation: SlackBotInstallation): DocumentData {
    return installation.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): SlackBotInstallation {
    return new SlackBotInstallation(snapshot.data())
  },
}

const slackChannelConverter: FirestoreDataConverter<SlackChannel> = {
  toFirestore(channel: SlackChannel): DocumentData {
    return channel.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): SlackChannel {
    return new SlackChannel(snapshot.id, snapshot.data())
  },
}

const communityBotConverter: FirestoreDataConverter<CommunityBot> = {
  toFirestore(bot: CommunityBot): DocumentData {
    return bot.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): CommunityBot {
    return new CommunityBot(snapshot.id, snapshot.data())
  },
}

const slackBotsCollection = () => getFirestore().collection('slackbots')

export const getSlackChannelRef = (teamId: string, channelId: string): DocumentReference<SlackChannel> => {
  return slackBotsCollection().doc(teamId).collection('channels').doc(channelId).withConverter(slackChannelConverter)
}

export const slackChannelExists = async (teamId: string, channelId: string): Promise<boolean> => {
  const snapshot = await getSlackChannelRef(teamId, channelId).get()
  return snapshot.exists
}

/** Bolt installationStore.storeInstallation 相当 */
export const setSlackInstallation = async (key: string, installation: unknown): Promise<void> => {
  const parsed = installation as { incomingWebhook?: SlackIncomingWebhook }
  const incomingWebhook = parsed.incomingWebhook
  if (incomingWebhook == null) {
    throw new Error('installation.incomingWebhook is required')
  }
  const parsedWebhook = SlackIncomingWebhookSchema.parse(incomingWebhook)
  const channelId = getIncomingWebhookChannelId(parsedWebhook)

  const encodedData = JSON.stringify(installation)
  const docRef = slackBotsCollection().doc(key).withConverter(slackBotInstallationConverter)
  await docRef.set(new SlackBotInstallation({ oauth_data: encodedData }))

  const channelRef = getSlackChannelRef(key, channelId)
  const channel = new SlackChannel(channelId, {
    url: parsedWebhook.url,
    channel: parsedWebhook.channel,
    channel_id: channelId,
    configuration_url: parsedWebhook.configuration_url ?? parsedWebhook.configurationUrl,
  })
  await channelRef.set(channel)
}

/** Bolt installationStore.fetchInstallation 相当 */
export const getSlackInstallation = async (key: string): Promise<unknown> => {
  const docRef = slackBotsCollection().doc(key).withConverter(slackBotInstallationConverter)
  const snapshot = await docRef.get()
  if (!snapshot.exists) {
    throw new Error('Installation not found')
  }
  const data = snapshot.data()
  if (data?.oauth_data == null) {
    throw new Error('Installation oauth_data is missing')
  }
  return JSON.parse(data.oauth_data) as unknown
}

/** Bolt installationStore.deleteInstallation 相当 */
export const deleteSlackInstallation = async (key: string): Promise<void> => {
  await slackBotsCollection().doc(key).delete()
}

export const addCommunityBot = async (
  communityId: string,
  botKey: string,
  channelRef: DocumentReference<SlackChannel>,
): Promise<void> => {
  const db = getFirestore()
  const botRef = db
    .collection('communities')
    .doc(communityId)
    .collection('bots')
    .doc(botKey)
    .withConverter(communityBotConverter)
  await botRef.set(
    new CommunityBot(botKey, {
      type: 'slack',
      reference: channelRef,
    }),
  )
}

export const removeCommunityBot = async (communityId: string, botKey: string): Promise<void> => {
  const db = getFirestore()
  const botRef = db.collection('communities').doc(communityId).collection('bots').doc(botKey)
  await botRef.delete()
}

export const getCommunityBots = async (communityId: string): Promise<CommunityBot[]> => {
  const db = getFirestore()
  const snapshot = await db
    .collection('communities')
    .doc(communityId)
    .collection('bots')
    .withConverter(communityBotConverter)
    .get()
  return snapshot.docs.map((doc) => doc.data())
}

export const getSlackWebhookUrl = async (reference: DocumentReference): Promise<string | undefined> => {
  const snapshot = await reference.withConverter(slackChannelConverter).get()
  return snapshot.data()?.url
}

export const makeSlackBotKey = (params: {
  isEnterpriseInstall: boolean
  enterpriseId?: string
  teamId: string
  channelId: string
}): string => {
  const slackId =
    params.isEnterpriseInstall && params.enterpriseId != null && params.enterpriseId !== ''
      ? params.enterpriseId
      : params.teamId
  return `slack-${slackId}-${params.channelId}`
}
