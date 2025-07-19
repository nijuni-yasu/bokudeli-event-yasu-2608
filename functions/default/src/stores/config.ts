import { DocumentData, FirestoreDataConverter, getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { ConfigGlobal } from '@shokujii/common/schemas/Config.js'

const configGlobalConverter: FirestoreDataConverter<ConfigGlobal> = {
  toFirestore(config: ConfigGlobal): DocumentData {
    return config.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ConfigGlobal {
    return new ConfigGlobal(snapshot.id, snapshot.data())
  },
}

export const getConfigGlobal = async (): Promise<ConfigGlobal | undefined> => {
  const db = getFirestore()
  const configRef = db.collection('config').doc('global').withConverter(configGlobalConverter)
  const snapshot = await configRef.get()
  return snapshot.exists ? snapshot.data() ?? undefined : undefined
}
