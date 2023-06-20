import { FirestoredUser } from '@/schemes/storedUser'
import { DocumentReference, collection, getDocs } from 'firebase/firestore'

export const loadCommunityMembers = async (communityRef: DocumentReference) => {
  const membersRef = collection(communityRef, 'members')
  const membersSnapshot = await getDocs(membersRef)
  return membersSnapshot.docs.map((doc) => doc.data() as FirestoredUser)
}
