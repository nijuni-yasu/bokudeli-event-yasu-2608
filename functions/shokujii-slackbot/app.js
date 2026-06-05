import { onRequest } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'

import bolt from '@slack/bolt'
const { App, ExpressReceiver } = bolt

const SLACK_SIGNING_SECRET = defineSecret('SLACK_SIGNING_SECRET')
const SLACK_CLIENT_ID = defineSecret('SLACK_CLIENT_ID')
const SLACK_CLIENT_SECRET = defineSecret('SLACK_CLIENT_SECRET')
const SLACK_STATE_SECRET = defineSecret('SLACK_STATE_SECRET')
const SLACK_COMMAND_NAME = defineString('SLACK_COMMAND_NAME', { default: 'shokujii' })

const db = getFirestore()
const slackBotsRef = db.collection('slackbots')

const database = {
  set: async (key, data) => {
    console.debug('set: ', key, data)
    const encodedData = JSON.stringify(data)
    const incomingWebhook = data.incomingWebhook

    const docRef = slackBotsRef.doc(key)
    await docRef.set({ oauth_data: encodedData })
    await docRef.collection('channels').doc(incomingWebhook.channelId).set(incomingWebhook)
  },
  get: async (key) => {
    const slackBotDocRef = slackBotsRef.doc(key)
    const slackBotSnap = await slackBotDocRef.get()
    const { oauth_data } = slackBotSnap.data()
    const data = JSON.parse(oauth_data)
    console.debug('get: ', key, data)
    return data
  },
  delete: async (key) => {
    console.debug('delete: ', key)
    await slackBotsRef.doc(key).delete()
  },
}

const getBotRef = async (command) => {
  return db.collection('slackbots').doc(command.team_id).collection('channels').doc(command.channel_id)
}

const makeBotKey = (command) => {
  const slackId =
    command.is_enterprise_install && command.enterprise_id !== undefined ? command.enterprise_id : command.team_id
  const channel_id = command.channel_id
  return `slack-${slackId}-${channel_id}`
}

/** @type {import('@slack/bolt').ExpressReceiver | undefined} */
let cachedReceiver

const registerCommands = (boltApp, commandName) => {
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

    if (communityAccountAndId === undefined) {
      await respond(`コミュニティが指定されていません`)
      return
    }

    const [communityAccount, communityId] = communityAccountAndId.split('-')
    if (communityId === undefined) {
      await respond(`入力された値があっていません`)
      return
    }

    const communitiesRef = db.collection('communities')
    const communityQuery = communitiesRef.where('community_account', '==', communityAccount)
    const querySnapshot = await communityQuery.get()
    if (querySnapshot.empty) {
      await respond(`入力された値があっていません`)
      return
    }

    const targetQueryDocumentSnapshot = querySnapshot.docs[0]
    const communityDocumentData = targetQueryDocumentSnapshot.data()
    if (communityId !== communityDocumentData.community_id) {
      await respond(`入力された値があっていません`)
      return
    }

    const targetCommunityName = communityDocumentData.community_name

    const botRef = await getBotRef(command)
    if (!(await botRef.get()).exists) {
      await respond('このチャンネルにはボットが登録されていません')
      return
    }

    const communityBotsRef = targetQueryDocumentSnapshot.ref.collection('bots')
    const botKey = makeBotKey(command)
    switch (subCommand) {
      case 'add':
        await communityBotsRef.doc(botKey).set({
          type: 'slack',
          reference: botRef,
        })
        await respond(`コミュニティ ${targetCommunityName} を登録しました！`)
        break
      case 'remove':
        await communityBotsRef.doc(botKey).delete()
        await respond(`コミュニティ ${targetCommunityName} を削除しました！`)
        break
      default:
        await respond(`コマンドが不正です`)
        break
    }
  })
}

const getExpressReceiver = () => {
  if (cachedReceiver != null) {
    return cachedReceiver
  }

  cachedReceiver = new ExpressReceiver({
    signingSecret: SLACK_SIGNING_SECRET.value(),
    clientId: SLACK_CLIENT_ID.value(),
    clientSecret: SLACK_CLIENT_SECRET.value(),
    stateSecret: SLACK_STATE_SECRET.value(),
    scopes: ['chat:write', 'commands', 'incoming-webhook'],
    installationStore: {
      storeInstallation: async (installation) => {
        if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
          return await database.set(installation.enterprise.id, installation)
        }
        if (installation.team !== undefined) {
          return await database.set(installation.team.id, installation)
        }
        throw new Error('Failed saving installation data to installationStore')
      },
      fetchInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
          return await database.get(installQuery.enterpriseId)
        }
        if (installQuery.teamId !== undefined) {
          return await database.get(installQuery.teamId)
        }
        throw new Error('Failed fetching installation')
      },
      deleteInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
          return await database.delete(installQuery.enterpriseId)
        }
        if (installQuery.teamId !== undefined) {
          return await database.delete(installQuery.teamId)
        }
        throw new Error('Failed to delete installation')
      },
    },
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
  return cachedReceiver
}

export const slackbot = onRequest(
  {
    region: 'asia-northeast1',
    invoker: 'public',
    secrets: ['SLACK_SIGNING_SECRET', 'SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET', 'SLACK_STATE_SECRET'],
  },
  (req, res) => getExpressReceiver().app(req, res),
)
