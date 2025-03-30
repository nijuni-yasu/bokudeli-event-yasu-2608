import { db } from '../firebase.js';

export const getEvent = async (transaction, eventId) => {
  const events = await transaction.get(db.collectionGroup('events').where('event_id', '==', eventId));
  return events.size === 1 ? events.docs[0] : null;
};