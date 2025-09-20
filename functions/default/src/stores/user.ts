import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
import { User } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'

export class ShokujiiUser extends User {
  // TODO Add other UserPersonalInformation fields
  user_email?: string

  constructor(id: string | null, data: Partial<User> & Partial<UserPersonalInformation>) {
    const db = getFirestore()
    if (id === null) {
      id = db.collection('users').doc().id
    }

    super(id, data)
    Object.assign(this, new UserPersonalInformation(id, data))
  }
}

const userConverter: FirestoreDataConverter<ShokujiiUser> = {
  toFirestore(config: User): DocumentData {
    return config.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiUser {
    return new User(snapshot.id, snapshot.data())
  },
}

const userPersonalInformationConverter: FirestoreDataConverter<UserPersonalInformation> = {
  toFirestore(config: UserPersonalInformation): DocumentData {
    return config.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): UserPersonalInformation {
    return new UserPersonalInformation(snapshot.id, snapshot.data())
  },
}

export const getUser = async (userId: string, withPersonalInformation: boolean): Promise<ShokujiiUser | undefined> => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(userId).withConverter(userConverter)
  const user = (await userRef.get()).data()
  if (user == null) {
    return undefined
  }
  if (withPersonalInformation) {
    const userPersonalInformation = await getUserPersonalInformation(userId)
    user.user_email = userPersonalInformation?.user_email
  }
  return user
}

export const getUserPersonalInformation = async (userId: string): Promise<UserPersonalInformation | undefined> => {
  const db = getFirestore()
  const userPersonalInformationRef = db
    .collection('users_personal_information')
    .doc(userId)
    .withConverter(userPersonalInformationConverter)
  return (await userPersonalInformationRef.get()).data()
}

export const saveUser = async (user: ShokujiiUser, transaction?: Transaction) => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(user.id).withConverter(userConverter)
  const userPersonalInformationRef = db
    .collection('users_personal_information')
    .doc(user.id)
    .withConverter(userPersonalInformationConverter)
  const upi = new UserPersonalInformation(user.id, {
    user_email: user.user_email,
  })
  if (transaction === undefined) {
    await userRef.set(user, { merge: true })
    await userPersonalInformationRef.set(upi, { merge: true })
  } else {
    transaction.set(userRef, user, { merge: true })
    transaction.set(userPersonalInformationRef, upi, { merge: true })
  }
}
