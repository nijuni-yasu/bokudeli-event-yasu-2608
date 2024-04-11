// import firebase from "firebase/compat/app";
// Required for side-effects
// import "firebase/firestore";

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, addDoc, setDoc, getDoc, deleteDoc } = require('firebase/firestore');
const { App, LogLevel } = require('@slack/bolt');

require('dotenv').config();

function removeUndefinedValues(obj) {
  // 配列の場合、再帰的にこの関数を各要素に適用
  if (Array.isArray(obj)) {
    return obj
      .map(v => removeUndefinedValues(v))
      .filter(v => v !== undefined); // 配列からundefinedを削除
  }
  // オブジェクトの場合、キーをイテレートしundefinedでない値のみを新しいオブジェクトにコピー
  else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined) { // undefinedでない値だけを新しいオブジェクトに追加
        newObj[key] = removeUndefinedValues(value); // 再帰的に適用
      }
    });
    return newObj;
  }
  // 配列でもオブジェクトでもない場合、値をそのまま返す（基本的なデータ型）
  return obj;
}

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGE_SENDER_ID,
  appId: process.env.VITE_APP_ID,
  measurementId: process.env.VITE_MEASUREMENT_ID,
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp);
const slackBotsRef = collection(db, 'slackbots')

const database = {
  set: async (key, data) => {
    const cleanedData = removeUndefinedValues(data)
    console.debug('set', key, cleanedData);
    await setDoc(doc(db, 'slackbots', key), cleanedData)
  },
  get: async (key) => {
    const slackBotDocRef = doc(slackBotsRef, key)
    const slackBotSnap = await getDoc(slackBotDocRef)
    console.log('get', slackBotSnap.data());
    return slackBotSnap.data()
  },
  delete: async (key) => {
    console.debug('delete', key);
    await deleteDoc(doc(slackBotsRef, key))
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
  },
  installerOptions: {
    // If this is true, /slack/install redirects installers to the Slack authorize URL
    // without rendering the web page with "Add to Slack" button.
    // This flag is available in @slack/bolt v3.7 or higher
    // directInstall: true,
  }
});

app.command('/shokujii', async ({ command, ack, respond }) => {
  // コマンドリクエストを確認
  await ack();

  await respond(`こんにちは ${command.user_name} さん！`);
});

(async () => {
  // アプリを起動します
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();