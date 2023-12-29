import { FirestoredUser } from '@/schemes/storedUser'
import { DocumentReference, collection, getDocs } from 'firebase/firestore'

export const loadCommunityManagers = async (communityRef: DocumentReference) => {
  const managersRef = collection(communityRef, 'managers')
  const managersSnapshot = await getDocs(managersRef)
  return managersSnapshot.docs.map((doc) => doc.data() as FirestoredUser)
}