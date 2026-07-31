<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import UserSuccessJoinEventDialog from '@shokujii/base/components/UserSuccessJoinEventDialog.vue'
import { useUserEventListByUserId } from '@shokujii/base/stores/userEventList.js'
import { waitForEventChatMembership } from '@shokujii/base/stores/chat.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getChatPath, getOrdersPath } from '@/router/utils'
import UserProfilePage from '@/components/profile/UserProfilePage.vue'

const PROFILE_EVENT_PAGE_SIZE = 6
const profileFilter = { kind: 'pf-null' as const }

const route = useRoute()
const router = useRouter()
const notification = useNotification()
const { t: $t } = useI18n()
const { user: loginUser, firebaseUser } = storeToRefs(useCurrentUserStore())

const userId = computed(() => String(route.params.userId ?? ''))

const profileOwnerUid = computed(() => loginUser.value?.user_id ?? firebaseUser.value?.uid ?? '')

const isOwner = computed(() => profileOwnerUid.value !== '' && profileOwnerUid.value === userId.value)

const shouldShowProfile = ref(true)

const hasCheckoutReturnQuery = computed(() => route.query.eventId != null && route.query.communityAccount != null)

const redirectFromLegacyOrdersRoutes = (): boolean => {
  if (!isOwner.value) {
    return false
  }
  const tab = String(route.query.tab ?? '')

  if (tab === 'orders') {
    void router.replace(getOrdersPath())
    return true
  }
  if (tab === 'usage') {
    void router.replace(getOrdersPath())
    return true
  }
  return false
}

watch(
  () => [route.query.tab, profileOwnerUid.value, userId.value] as const,
  () => {
    shouldShowProfile.value = !redirectFromLegacyOrdersRoutes()
  },
  { immediate: true },
)

const navigateToEventChat = async (params: { communityId: string; eventId: string }): Promise<boolean> => {
  const uid = profileOwnerUid.value
  if (uid === '') {
    return false
  }
  try {
    const roomId = await waitForEventChatMembership(uid, params.communityId, params.eventId)
    if (roomId == null) {
      notification.show($t('chat.error.preparing'), 'warning')
      return false
    }
    await router.push(getChatPath(roomId))
    return true
  } catch {
    notification.show($t('chat.error.open_failed'), 'error')
    return false
  }
}

const isUserSuccessJoinEventDialogVisible = ref(false)

watch(
  [hasCheckoutReturnQuery, isOwner],
  ([hasCheckout, owner]) => {
    if (hasCheckout && owner) {
      isUserSuccessJoinEventDialogVisible.value = true
    }
  },
  { immediate: true },
)

watch(
  () => [route.query.eventId, route.query.communityAccount, profileOwnerUid.value, isOwner.value] as const,
  ([eventId, communityAccount, uid, owner]) => {
    if (!owner || uid === '') return
    if (eventId != null && communityAccount != null) {
      useUserEventListByUserId(uid, PROFILE_EVENT_PAGE_SIZE, { profileFilter, autoLoad: false }).reload()
    }
  },
  { immediate: true },
)
</script>

<template>
  <UserProfilePage v-if="shouldShowProfile" :key="userId" :user-id="userId" />
  <UserSuccessJoinEventDialog
    v-if="isOwner && hasCheckoutReturnQuery"
    v-model="isUserSuccessJoinEventDialogVisible"
    :event-id="String(route.query.eventId ?? '')"
    :community-account="String(route.query.communityAccount ?? '')"
    :is-posted="route.query.isPosted === 'true'"
    :session-id="String(route.query.session_id ?? '')"
    :user-id="profileOwnerUid"
    :navigate-to-event-chat="navigateToEventChat"
  />
</template>
