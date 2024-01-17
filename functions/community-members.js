const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const update_community_members = (_, context) =>
    db.runTransaction(async (transaction) => {
        const communityRef = db.collection('communities').doc(context.params.communityId);
        const membersRef = communityRef.collection('members');
        const membersSnapshot = await transaction.get(membersRef)
        const members = membersSnapshot.docs.map((member) => db.collection('users').doc(member.id));
        transaction.update(communityRef, { members });
    });

exports.create_community_members = functions
    .region('asia-northeast1')
    .firestore
    .document('communities/{communityId}/members/{userId}')
    .onCreate(update_community_members);

exports.delete_community_members = functions
    .region('asia-northeast1')
    .firestore
    .document('communities/{communityId}/members/{userId}')
    .onDelete(update_community_members);
