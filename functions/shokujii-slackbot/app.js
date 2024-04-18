const { onRequest } = require('firebase-functions/v2/https');

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const { App, LogLevel } = require('@slack/bolt');

require('dotenv').config();

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();
const slackBotsRef = db.collection('slackbots')

const database = {
  set: async (key, data) => {
    const encodedData = JSON.stringify(data)
    console.debug('set', key, encodedData);

    // undefined の項目を削除するために parse する
    const decodedData = JSON.parse(encodedData);

    await slackBotsRef.doc(key).set({ oauth_data: encodedData, incoming_webhook: decodedData.incomingWebhook })
  },
  get: async (key) => {
    const slackBotDocRef = slackBotsRef.doc(key)
    const slackBotSnap = await slackBotDocRef.get()
    const { oauth_data } = slackBotSnap.data()
    const data = JSON.parse(oauth_data)
    console.debug('get', data);
    return data;
  },
  delete: async (key) => {
    console.debug('delete', key);
    await slackBotsRef.doc(key).delete()
  }
};

// ボットトークンとソケットモードハンドラーを使ってアプリを初期化します
const app = new App({
  logLevel: LogLevel.DEBUG,
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
  }
});

const getSlackId = (payload) => {
  if (payload.is_enterprise_install && payload.enterprise_id !== undefined) {
    return payload.enterprise_id;
  }
  return payload.team_id;
}

app.command('/shokujii', async ({ command, ack, respond, payload }) => {
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
  const communityData = querySnapshot.docs[0].data();
  console.debug('communityData', communityData);

  //TODO コミュニティに slack の情報を追加する
  console.debug('slack id', getSlackId(payload));

  //Botで表示する文言を設定
  await respond(`${communityData.community_name} を登録しました！`);
});

const slackbot = onRequest(app);
module.exports = { slackbot };

// (async () => {
//   // アプリを起動します
//   await app.start(process.env.PORT || 3000);

//   console.log('⚡️ Bolt app is running!');
// })();
