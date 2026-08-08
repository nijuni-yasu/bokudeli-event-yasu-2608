import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import bolt from '@slack/bolt'
import type { Installation, InstallProviderOptions } from '@slack/bolt'
import { getCommunity } from './stores/community.js'
import {
  addCommunityBot,
  deleteSlackInstallation,
  getSlackChannelRef,
  getSlackInstallation,
  makeSlackBotKey,
  removeCommunityBot,
  setSlackInstallation,
  slackChannelExists,
} from './stores/slackBot.js'
import { createModuleLogger } from './utils/logger.js'

const { App, ExpressReceiver } = bolt

const logger = createModuleLogger('slackbot')

const SLACK_SIGNING_SECRET = defineSecret('SLACK_SIGNING_SECRET')
const SLACK_CLIENT_ID = defineSecret('SLACK_CLIENT_ID')
const SLACK_CLIENT_SECRET = defineSecret('SLACK_CLIENT_SECRET')
const SLACK_STATE_SECRET = defineSecret('SLACK_STATE_SECRET')
const SLACK_COMMAND_NAME = defineString('SLACK_COMMAND_NAME', { default: 'shokujii' })

/** @type {import('@slack/bolt').ExpressReceiver | undefined} */
let cachedReceiver: InstanceType<typeof ExpressReceiver> | undefined

const registerCommands = (boltApp: InstanceType<typeof App>, commandName: string) => {
  boltApp.command(`/${commandName}`, async ({ command, ack, respond }) => {
    await ack()

    const [subCommand, communityAccountAndId] = command.text.split(' ')
    switch (subCommand) {
      case 'add':
      case 'remove':
        break
      default:
        await respond(`${subCommand} はサポートされていません`)
        return
    }

    if (communityAccountAndId == null || communityAccountAndId === '') {
      await respond('コミュニティが指定されていません')
      return
    }

    const [communityAccount, communityId] = communityAccountAndId.split('-')
    if (communityId == null || communityId === '') {
      await respond('入力された値があっていません')
      return
    }

    const community = await getCommunity(communityId)
    if (community == null || community.community_account !== communityAccount) {
      await respond('入力された値があっていません')
      return
    }

    const teamId = command.team_id
    const channelId = command.channel_id
    if (teamId == null || channelId == null) {
      await respond('このチャンネルにはボットが登録されていません')
      return
    }

    const channelRegistered = await slackChannelExists(teamId, channelId)
    if (!channelRegistered) {
      await respond('このチャンネルにはボットが登録されていません')
      return
    }

    const botKey = makeSlackBotKey({
      isEnterpriseInstall: Boolean(command.is_enterprise_install) && command.enterprise_id != null,
      enterpriseId: command.enterprise_id,
      teamId,
      channelId,
    })
    const channelRef = getSlackChannelRef(teamId, channelId)

    switch (subCommand) {
      case 'add':
        await addCommunityBot(community.id, botKey, channelRef)
        await respond(`コミュニティ ${community.community_name} を登録しました！`)
        break
      case 'remove':
        await removeCommunityBot(community.id, botKey)
        await respond(`コミュニティ ${community.community_name} を削除しました！`)
        break
      default:
        await respond('コマンドが不正です')
        break
    }
  })
}

const getExpressReceiver = (): InstanceType<typeof ExpressReceiver> => {
  if (cachedReceiver != null) {
    return cachedReceiver
  }

  const installationStore: InstallProviderOptions['installationStore'] = {
    storeInstallation: async (installation: Installation) => {
      if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
        await setSlackInstallation(installation.enterprise.id, installation)
        return
      }
      if (installation.team !== undefined) {
        await setSlackInstallation(installation.team.id, installation)
        return
      }
      throw new Error('Failed saving installation data to installationStore')
    },
    fetchInstallation: async (installQuery) => {
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        return (await getSlackInstallation(installQuery.enterpriseId)) as Installation
      }
      if (installQuery.teamId !== undefined) {
        return (await getSlackInstallation(installQuery.teamId)) as Installation
      }
      throw new Error('Failed fetching installation')
    },
    deleteInstallation: async (installQuery) => {
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        await deleteSlackInstallation(installQuery.enterpriseId)
        return
      }
      if (installQuery.teamId !== undefined) {
        await deleteSlackInstallation(installQuery.teamId)
        return
      }
      throw new Error('Failed to delete installation')
    },
  }

  cachedReceiver = new ExpressReceiver({
    signingSecret: SLACK_SIGNING_SECRET.value(),
    clientId: SLACK_CLIENT_ID.value(),
    clientSecret: SLACK_CLIENT_SECRET.value(),
    stateSecret: SLACK_STATE_SECRET.value(),
    scopes: ['chat:write', 'commands', 'incoming-webhook'],
    installationStore,
    installerOptions: {
      directInstall: true,
    },
    processBeforeResponse: true,
  })

  const boltApp = new App({
    receiver: cachedReceiver,
    processBeforeResponse: true,
  })

  registerCommands(boltApp, SLACK_COMMAND_NAME.value())
  logger.info('ExpressReceiver initialized')
  return cachedReceiver
}

export const slackbot = onRequest(
  {
    region: 'asia-northeast1',
    invoker: 'public',
    secrets: ['SLACK_SIGNING_SECRET', 'SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET', 'SLACK_STATE_SECRET'],
  },
  (req, res) => {
    getExpressReceiver().app(req, res)
  },
)
