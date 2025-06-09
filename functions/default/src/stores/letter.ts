import { DocumentData, FirestoreDataConverter, getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { Letter } from '../schemas/CommunityLetter.js'

const letterConverter: FirestoreDataConverter<Letter> = {
  toFirestore(letter: Letter): DocumentData {
    return letter.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Letter {
    return new Letter(snapshot.id, snapshot.data())
  },
}

export const getLetter = async (communityId: string, letterId: string): Promise<Letter | undefined> => {
  const db = getFirestore()
  const letterRef = db
    .collection('communities')
    .doc(communityId)
    .collection('letters')
    .doc(letterId)
    .withConverter(letterConverter)
  const snapshot = await letterRef.get()
  return snapshot.data()
}
