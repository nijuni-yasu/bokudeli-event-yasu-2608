import { FirestoredUser } from '@/schemes/storedUser'
import { DocumentReference, collection, getDocs } from 'firebase/firestore'
import { useStoreStoredUser } from '@/stores/storedUser'
const { storedUser } = storeToRefs(useStoreStoredUser())
const userId = computed(() => storedUser?.value?.userId ?? '')

export const checkCommunityMember = async (communityRef: DocumentReference) => {
  const membersRef = collection(communityRef, 'members')
  const membersSnapshot = await getDocs(membersRef)
  const members = membersSnapshot.docs.map((doc) => doc.data() as FirestoredUser)
  return members.some(member => member.user_id == userId.value)  
}