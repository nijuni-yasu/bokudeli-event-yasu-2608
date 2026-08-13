<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getOrdersPath } from '@/router/utils'
import { fetchEnterpriseUsageTabEligible } from '@/composable/enterpriseMemberMonthlyUsage.js'
import UserProfilePage from '@/components/profile/UserProfilePage.vue'

const route = useRoute()
const router = useRouter()
const { user: loginUser, firebaseUser } = storeToRefs(useCurrentUserStore())

const userId = computed(() => String(route.params.userId ?? ''))

const profileOwnerUid = computed(() => loginUser.value?.user_id ?? firebaseUser.value?.uid ?? '')

const shouldShowProfile = ref(true)

const redirectFromLegacyOrdersRoutes = (): boolean => {
  const uid = profileOwnerUid.value
  const isOwner = uid !== '' && uid === userId.value
  const tab = String(route.query.tab ?? '')

  if (tab === 'orders' && isOwner) {
    void router.replace(getOrdersPath())
    return true
  }
  if (tab === 'usage' && isOwner && uid !== '') {
    const requestPath = route.fullPath
    void fetchEnterpriseUsageTabEligible(uid)
      .then((eligible) => {
        if (route.fullPath !== requestPath) return
        void router.replace(getOrdersPath(eligible ? 'usage' : undefined))
      })
      .catch(() => {
        if (route.fullPath !== requestPath) return
        void router.replace(getOrdersPath())
      })
    return true
  }
  if (isOwner && route.query.eventId != null && route.query.communityAccount != null) {
    void router.replace({
      path: '/orders',
      query: {
        eventId: String(route.query.eventId),
        communityAccount: String(route.query.communityAccount),
        ...(route.query.isPosted != null ? { isPosted: String(route.query.isPosted) } : {}),
        ...(route.query.session_id != null ? { session_id: String(route.query.session_id) } : {}),
      },
    })
    return true
  }
  return false
}

watch(
  () =>
    [
      route.query.tab,
      route.query.eventId,
      route.query.communityAccount,
      route.query.isPosted,
      route.query.session_id,
      profileOwnerUid.value,
      userId.value,
    ] as const,
  () => {
    shouldShowProfile.value = !redirectFromLegacyOrdersRoutes()
  },
  { immediate: true },
)
</script>

<template>
  <UserProfilePage v-if="shouldShowProfile" :key="userId" :user-id="userId" />
</template>
