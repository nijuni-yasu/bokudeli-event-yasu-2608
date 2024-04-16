import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { test, vi, expect, describe, beforeAll, afterEach, beforeEach, afterAll } from 'vitest';
import firebaseFunctionsTest from 'firebase-functions-test';
import sgMail from '@sendgrid/mail';

if (process.env.FIRESTORE_EMULATOR_HOST == null) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}
const projectId = 'demo-emulator';

initializeApp({
  projectId,
  // credential: applicationDefault(),
});
const functionsTest = firebaseFunctionsTest({
  projectId,
});

const db = getFirestore();

beforeEach(() => {
  vi.mock('@sendgrid/mail', () => ({
    default: {
      setApiKey: () => { },
      send: vi.fn(() => Promise.resolve()),
    },
  }));
});

afterEach(async () => {
  vi.restoreAllMocks();
});

const initializeDb = async (data) => {
  for (const [collection, documents] of Object.entries(data)) {
    for (const [doc, docData] of Object.entries(documents)) {
      await db.collection(collection).doc(doc).set(docData);
    }
  }
}

describe('event_information のテスト', () => {
  // event_information はデータベースに変化を与えないので、あえて beforeAll で初期化する
  beforeAll(async () => {
    await initializeDb((await import('./sendgrid-mail.data')).event_information_default);
  })

  afterAll(async () => {
    await functionsTest.firestore.clearFirestoreData({
      projectId,
    });
  })

  test('イベント開催情報が正しく送信される', async () => {
    // vi.useFakeTimers() の使用や Date constructor の mock 化は firestore の動作を変えてしまうため、
    // このテストでは使えない。現在時刻を取得する際は、`Date.now()` を使用すること。
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-16T01:00:00Z').getTime());

    const event_information = functionsTest.wrap((await import('../sendgrid-mail')).event_information);
    await event_information();

    // assert
    const expected = {
      from: '食事でつながるshokujii<shokujii@nijuni.jp>',
      templateId: 'd-32df61e4ef334bf4a3a6071096679864',
      asm: {
        groupId: 25345,
      },
      dynamic_template_data: {
        date: '01/16',
        events: [
          {
            event_name: '2nd event',
            event_address: '東京都渋谷区2',
            event_datetime: '2024/01/18 (木) 11:00〜13:00',
            event_deadline_datetime: '2024/01/16 (火) 11:00',
            event_desc: '2nd event description',
            event_url: 'https://undefined/c/undefined/e/2ndEvent',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/2nd.png',
            shop_name: '2nd shop',
            community_name: 'ぼくデリ2'
          },
          {
            event_name: '3rd event',
            event_address: '東京都渋谷区3',
            event_datetime: '2024/02/02 (金) 17:00〜20:00',
            event_deadline_datetime: '2024/01/25 (木) 14:00',
            event_desc: '3rd event description',
            event_url: 'https://undefined/c/undefined/e/3rdEvent',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/3rd.png',
            shop_name: '3rd shop',
            community_name: 'ぼくデリ3'
          },
        ],
      },
    }

    expect(sgMail.send).toHaveBeenCalledTimes(3); // 3 users
    [['ichiro@test.com', 'Ichiro'], ['jiro@test.com', 'Jiro'], ['sab@test.com', 'Saburo']].forEach((d, i) => {
      expected.to = d[0];
      expected.dynamic_template_data.user_name = d[1];
      expect(sgMail.send).toHaveBeenNthCalledWith(i + 1, expected);
    });
  })

  test('イベント開催情報件数が0の場合、メール送信を行わない', async () => {
    // vi.useFakeTimers() の使用や Date constructor の mock 化は firestore の動作を変えてしまうため、
    // このテストでは使えない。現在時刻を取得する際は、`Date.now()` を使用すること。
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2024-03-01T01:00:00Z').getTime());

    const event_information = functionsTest.wrap((await import('../sendgrid-mail')).event_information);
    await event_information();

    expect(sgMail.send).toHaveBeenCalledTimes(0);
  })

  test('イベント開催情報のプレビューが正しく運営のみに送信される', async () => {
    // vi.useFakeTimers() の使用や Date constructor の mock 化は firestore の動作を変えてしまうため、
    // このテストでは使えない。現在時刻を取得する際は、`Date.now()` を使用すること。
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-15T01:00:00Z').getTime());

    const event_information_preview = functionsTest.wrap((await import('../sendgrid-mail')).event_information_preview);
    await event_information_preview();

    // assert
    const expected = {
      from: '食事でつながるshokujii<shokujii@nijuni.jp>',
      to: 'support+to@nijuni.jp',
      templateId: 'd-32df61e4ef334bf4a3a6071096679864',
      asm: {
        groupId: 25345,
      },
      dynamic_template_data: {
        date: '01/16',
        user_name: 'テストユーザー',
        events: [
          {
            event_name: '2nd event',
            event_address: '東京都渋谷区2',
            event_datetime: '2024/01/18 (木) 11:00〜13:00',
            event_deadline_datetime: '2024/01/16 (火) 11:00',
            event_desc: '2nd event description',
            event_url: 'https://undefined/c/undefined/e/2ndEvent',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/2nd.png',
            shop_name: '2nd shop',
            community_name: 'ぼくデリ2'
          },
          {
            event_name: '3rd event',
            event_address: '東京都渋谷区3',
            event_datetime: '2024/02/02 (金) 17:00〜20:00',
            event_deadline_datetime: '2024/01/25 (木) 14:00',
            event_desc: '3rd event description',
            event_url: 'https://undefined/c/undefined/e/3rdEvent',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/3rd.png',
            shop_name: '3rd shop',
            community_name: 'ぼくデリ3'
          },
        ],
      },
    }

    expect(sgMail.send).toHaveBeenCalledOnce();
    expect(sgMail.send).toHaveBeenCalledWith(expected);
  })
  
  test('イベント開催情報件数が0の場合、運営に通知する', async () => {
    // vi.useFakeTimers() の使用や Date constructor の mock 化は firestore の動作を変えてしまうため、
    // このテストでは使えない。現在時刻を取得する際は、`Date.now()` を使用すること。
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2024-03-01T01:00:00Z').getTime());

    const event_information_preview = functionsTest.wrap((await import('../sendgrid-mail')).event_information_preview);
    await event_information_preview();

    expect(sgMail.send).toHaveBeenCalledOnce();
    expect(sgMail.send).toHaveBeenCalled({
      to: 'support+to@nijuni.jp',
      from: '食事でつながるshokujii<shokujii@nijuni.jp>',
      subject: '【プレビュー】明日のイベント情報について',
      text: '明日送信予定のイベント予定はありません'
    });
  })
})

describe('community_added のテスト', () => {
  test('community が新しく作成されたら、DEFAULT_TO にメールが送信される', async () => {
    const wrapped = functionsTest.wrap((await import('../sendgrid-mail')).community_added)
    const input = functionsTest.firestore.makeDocumentSnapshot({
      community_name: 'ぼくデリ',
      community_account: 'bokudeli',
    }, 'communities/5oxesNeS5dO078qABR98');
    await wrapped(input);

    // assert
    expect(sgMail.send).toHaveBeenCalledOnce();
    expect(sgMail.send).toHaveBeenCalledWith({
      to: 'support+to@nijuni.jp',
      from: '食事でつながるshokujii<shokujii@nijuni.jp>',
      subject: '「ぼくデリ」コミュニティが新規申請されました',
      text: '【ID】 5oxesNeS5dO078qABR98\n' +
        '【コミュニティ名】 ぼくデリ\n' +
        '【コミュニティアカウント】 bokudeli\n' +
        '【コミュニティページURL】 https://undefined/c/bokudeli',
    });
  });
})
