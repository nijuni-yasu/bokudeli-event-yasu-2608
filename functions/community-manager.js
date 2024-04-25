import functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import sgMail from '@sendgrid/mail';

// TODO 環境変数にして一元管理する
const DEFAULT_FROM = '食事でつながるshokujii<shokujii@nijuni.jp>';

const EXPIRED_TIME = 1000 * 60 * 60 * 24; // 24 hours

const db = getFirestore();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const send_invitaion_email_for_community_manager = functions
    .region('asia-northeast1')
    .https
    .onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (uid == null) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const communityId = data.communityId;
  const invitee_email = data.email;
  if (communityId == null || invitee_email == null) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with the arguments "communityId" and "email".');
  }
  const communityRef = db.collection('communities').doc(communityId);
  const isManager = (await communityRef.collection('members').doc(uid).get()).get('roles')?.includes('manager') ?? false;
  if (!isManager) {
    throw new functions.https.HttpsError('permission-denied', 'The function must be called by a manager.');
  }
  const now = Timestamp.now();
  const inviteRef = await communityRef.collection('invites').add({
    has_token_been_redeemed: false,
    inviter_id: uid,
    invitee_email: data.email,
    created_at: now,
    updated_at: now,
  });
  const communityAccount = (await communityRef.get()).get('community_account');
  // TODO URL の生成は共通化する
  const url = `https://${process.env.EVENT_HOST}/c/${communityAccount}/invites?t=${inviteRef.id}`;
  // TODO これ以上複雑になるようなら、テンプレートを使う
  const subject = `Shokujii コミュニティ ${communityAccount} への管理者招待`;
  const text = `Shokujii コミュニティ ${communityAccount} の管理者として招待されました。\n` +
      '承諾する場合は以下のリンクをクリックしてください。\n\n' +
      url;
  return sgMail.send({
      to: invitee_email,
      from: DEFAULT_FROM,
      subject,
      text,
  });
});

export const accept_invitation_for_community_manager = functions
    .region('asia-northeast1')
    .https
    .onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (uid == null) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const communityId = data.communityId;
  const token = data.token;
  if (communityId == null || token == null) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with the arguments "communityId" and "token".');
  }
  const inviteRef = db.doc(`communities/${communityId}/invites/${token}`);
  const inviteDoc = (await inviteRef.get());
  if (!inviteDoc.exists) {
    throw (new functions.https.HttpsError('not-found', 'The invitation does not exist.'));
  }
  const created_at = inviteDoc.get('created_at');
  if (created_at == null || created_at.toMillis() < Timestamp.now().toMillis() - EXPIRED_TIME) {
    throw new functions.https.HttpsError('invalid-argument', 'The token is expired.');
  }
  if (inviteDoc.get('has_token_been_redeemed') === true) {
    throw new functions.https.HttpsError('invalid-argument', 'The token has been redeemed.');
  }
  const now = Timestamp.now();
  // invite と set を batch で実行する
  const batch = db.batch().update(inviteRef, {
    has_token_been_redeemed: true,
    updated_at: now,
  });
  const memberRef = inviteRef.parent.parent.collection('members').doc(uid);
  const memberDoc = await memberRef.get();
  if (memberDoc.exists) {
    // 既に存在する場合は roles に 'manager' を追加
    const roles = new Set(memberDoc.get('roles') ?? []);
    roles.add('manager');
    batch.set(memberRef, {
      roles: Array.from(roles),
      updated_at: now,
    }, { merge: true });
  } else {
    batch.set(memberRef, {
      roles: ['manager'],
      created_at: now,
      updated_at: now,
    });
  }
  await batch.commit();
});
