import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

import bolt from '@slack/bolt';
const { App, LogLevel, ExpressReceiver } = bolt;

const db = getFirestore();
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
    console.debug('get: ', key, data);
    return data;
  },
  delete: async (key) => {
    console.debug('delete: ', key);
    await slackBotsRef.doc(key).delete()
  }
};

const expressReceiver = new ExpressReceiver({
  // logLevel: LogLevel.DEBUG,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: [
    'chat:write',
    'commands',
    'incoming-webhook'
  ],
  installationStore: {
    storeInstallation: async (installation) => {
      // change the line below so it saves to your database
      if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
        // support for org wide app installation
        return await database.set(installation.enterprise.id, installation);
      }
      if (installation.team !== undefined) {
        // single team app installation
        return await database.set(installation.team.id, installation);
      }
      throw new Error('Failed saving installation data to installationStore');
    },
    fetchInstallation: async (installQuery) => {
      // change the line below so it fetches from your database
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        // org wide app installation lookup
        return await database.get(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        return await database.get(installQuery.teamId);
      }
      throw new Error('Failed fetching installation');
    },
    deleteInstallation: async (installQuery) => {
      // change the line below so it deletes from your database
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        // org wide app installation deletion
        return await database.delete(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation deletion
        return await database.delete(installQuery.teamId);
      }
      throw new Error('Failed to delete installation');
    },
  },
  installerOptions: {
    directInstall: true
  },
  processBeforeResponse: true,
})
// ボットトークンとソケットモードハンドラーを使ってアプリを初期化します
const app = new App({
  receiver: expressReceiver,
  processBeforeResponse: true,
});

const makeBotKey = (command) => {
  const slackId = (command.is_enterprise_install && command.enterprise_id !== undefined) ? command.enterprise_id : command.team_id;
  const channel_id = command.channel_id
  return `slack-${slackId}-${channel_id}`
}

app.command('/shokujii', async ({ command, ack, respond }) => {
  console.debug('command', command);
  // コマンドリクエストを確認
  await ack();

  // 入力データからコミュニティアカウントを取得
  const communityAccount = command.text.split(' ')[0];

  // Firestore のコミュニティを取得
  const communitiesRef = db.collection('communities');
  const communityQuery = communitiesRef.where('community_account', '==', communityAccount);
  const querySnapshot = await communityQuery.get();
  if (querySnapshot.empty) {
    await respond(`コミュニティ ${communityAccount} は存在しません`);
    return;
  }

  // SlackBot を登録
  const targetQueryDocumentSnapshot = querySnapshot.docs[0];
  const communityDocRef = targetQueryDocumentSnapshot.ref;
  const communityBotsRef = communityDocRef.collection('bots');
  communityBotsRef.doc(makeBotKey(command)).set({
    type: 'slack',
    team_id: command.team_id,
    team_domain: command.team_domain,
    channel_id: command.channel_id,
    channel_name: command.channel_name,
    is_enterprise_install: command.is_enterprise_install,
    enterprise_id: command.enterprise_id ?? ''
  });

  // コミュニティ情報を取得
  const communityData = targetQueryDocumentSnapshot.data();

  //Botで表示する文言を設定
  await respond(`${communityData.community_name} を登録しました！`);
});

export const slackbot = onRequest({
    region: 'asia-northeast1',
  },
  expressReceiver.app
);
