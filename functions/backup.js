// https://firebase.google.com/docs/firestore/solutions/schedule-export

import functions from 'firebase-functions';
import firestore from '@google-cloud/firestore';

const client = new firestore.v1.FirestoreAdminClient();

const exportBucket = `gs://${process.env.GCLOUD_PROJECT}-firestore-backups`;

export const scheduled_firestore_export = functions
  .region('asia-northeast1')
  .pubsub
  .schedule('0 2 * * *') // every 2:00 AM
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const projectId = process.env.GCLOUD_PROJECT;
    const databaseName = client.databasePath(
      projectId,
      '(default)'
    );

    try {
      const responses = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: exportBucket,
        collectionIds: []
      });
      const response = responses[0];
      console.log(`Operation Name: ${response['name']}`);
      return response;
    } catch (err) {
      console.error(err);
      throw new Error('Export operation failed');
    }
  });
