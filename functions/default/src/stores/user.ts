import { DocumentData, FirestoreDataConverter, getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { User } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'

export class ShokujiiUser extends User {
  user_email?: string
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
