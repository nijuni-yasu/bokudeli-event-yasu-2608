import { getFirestore } from 'firebase-admin/firestore'

export const getEvent = async (transaction, eventId) => {
  const db = getFirestore()
  const events = await transaction.get(db.collectionGroup('events').where('event_id', '==', eventId))
  return events.size === 1 ? events.docs[0] : null
}
