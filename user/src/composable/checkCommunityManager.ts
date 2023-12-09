import { FirestoredUser } from '@/schemes/storedUser'
import { DocumentReference, collection, getDocs } from 'firebase/firestore'
import { useStoreStoredUser } from '@/stores/storedUser'
const { storedUser } = storeToRefs(useStoreStoredUser())
const userId = computed(() => storedUser?.value?.userId ?? '')

export const checkCommunityManager = async (communityRef: DocumentReference) => {
  const managersRef = collection(communityRef, 'managers')
  const managersSnapshot = await getDocs(managersRef)
  const managers = managersSnapshot.docs.map((doc) => doc.data() as FirestoredUser)
  return managers.some(manager => manager.user_id == userId.value)
}