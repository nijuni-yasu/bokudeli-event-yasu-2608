import { getFirestore, FirestoreDataConverter, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore'
import { Event } from '../schemas/Event.js'
import { getUser, type ShokujiiUser } from './user.js'

class ShokujiiEventConverter implements FirestoreDataConverter<ShokujiiEvent> {
  constructor(private readonly userId?: string) {
    console.log('ShojukiEventConverter initialized with userId:', userId)
  }
  toFirestore(event: ShokujiiEvent): DocumentData {
    if (this.userId == null) {
      throw new Error('userId is required')
    }
    return event.toFirestore(this.userId)
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiEvent {
    return new ShokujiiEvent(snapshot.id, snapshot.data())
  }
}

export class ShokujiiEvent extends Event {
  async getMembers(withPersonalInformation: boolean): Promise<ShokujiiUser[]> {
    const members = await Promise.all(this.members.map(async (id) => getUser(id, withPersonalInformation)))
    return members.filter((member) => member !== undefined)
  }

  addMember(user: ShokujiiUser | string) {
    const id = typeof user === 'string' ? user : user.id
    super.addMember(id)
  }

  removeMember(user: ShokujiiUser | string) {
    const id = typeof user === 'string' ? user : user.id
    super.removeMember(id)
  }
}

export const getEvent = async (eventId: string): Promise<ShokujiiEvent | undefined> => {
  const db = getFirestore()
  const eventData = await db
    .collectionGroup('events')
    .where('event_id', '==', eventId)
    .limit(1)
    .withConverter(new ShokujiiEventConverter())
    .get()
  if (eventData.empty) {
    return undefined
  }
  return eventData.docs[0].data()
}

export const saveEvent = async (userId: string, event: ShokujiiEvent): Promise<void> => {
  const db = getFirestore()
  const eventRef = db
    .collection('communities')
    .doc(event.community_id)
    .collection('events')
    .doc(event.id)
    .withConverter(new ShokujiiEventConverter(userId))
  await eventRef.set(event, { merge: true })
}
