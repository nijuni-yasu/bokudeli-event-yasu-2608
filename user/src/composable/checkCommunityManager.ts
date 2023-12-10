import { FirestoredUser } from '@/schemes/storedUser'
import { DocumentReference, collection, getDocs } from 'firebase/firestore'
import { useStoreStoredUser } from '@/stores/storedUser'
const { storedUser } = storeToRefs(useStoreStoredUser())
const userId = computed(() => storedUser?.value?.userId ?? '')
const supportAccountUserId = import.meta.env.VITE_SUPPORT_ACCOUNT_USER_ID as string

export const checkCommunityManager = async (communityRef: DocumentReference) => {
  // ログインユーザーがサポートアカウントの場合、コミュニティマネージャーの権限を持つ
  if (userId.value === supportAccountUserId) {
    return true
  // ログインユーザーがコミュニティマネージャーの一員かをチェック
  } else {
    const managersRef = collection(communityRef, 'managers')
    const managersSnapshot = await getDocs(managersRef)
    const managers = managersSnapshot.docs.map((doc) => doc.data() as FirestoredUser)
    return managers.some(manager => manager.user_id == userId.value)
  }
}