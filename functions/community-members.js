import functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore();

const update_community_members = (_, context) =>
  db.runTransaction(async (transaction) => {
    const communityRef = db.collection('communities').doc(context.params.communityId);
    const membersRef = communityRef.collection('members');
    const membersSnapshot = await transaction.get(membersRef)
    const members = membersSnapshot.docs.map((member) => db.collection('users').doc(member.id));
    transaction.update(communityRef, {
      community_num_members: members.length,
      members,
    });
  });

export const create_community_members = functions
  .region('asia-northeast1')
  .firestore
  .document('communities/{communityId}/members/{userId}')
  .onCreate(update_community_members);

export const delete_community_members = functions
  .region('asia-northeast1')
  .firestore
  .document('communities/{communityId}/members/{userId}')
  .onDelete(update_community_members);
