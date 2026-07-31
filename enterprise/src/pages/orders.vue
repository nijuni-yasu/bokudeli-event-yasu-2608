<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Orders from '@shokujii/base/components/pages/orders.vue'
import { getEventPath, getReceiptPath, getOrdersPath } from '@/router/utils'
import EnterpriseSubsidyUsagePanel from '@/components/profile/EnterpriseSubsidyUsagePanel.vue'
import { useEnterpriseId } from '@/composable/useEnterpriseId'
import { fetchEnterpriseUsageTabEligible } from '@/composable/enterpriseMemberMonthlyUsage.js'
import { getAuth } from 'firebase/auth'
import { useUserProfileAuthState } from '@shokujii/base/composable/useUserProfileAuthState.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'

const route = useRoute()
const router = useRouter()
const { enterpriseId } = useEnterpriseId()
const { firebaseUser, user: loginUser } = storeToRefs(useCurrentUserStore())

// loginUser を読む前にゲートを初期化する（先読みすると useUserStore が autoSubscribe:true で生成され RC-17 抑止が無効化される）
const gateUserId = getAuth().currentUser?.uid ?? firebaseUser.value?.uid ?? ''
const { isProfileGateLoading, isProfileAccessDenied, isInvalidProfile, isPreviewAccessGranted, previewError } =
  useUserProfileAuthState(gateUserId, 'enterprise-callable-gate')

const profileUserId = computed(() => loginUser.value?.user_id ?? firebaseUser.value?.uid ?? '')

const showUsage = ref(false)
const usageSection = ref<HTMLElement | null>(null)

const normalizeUsageTabUrlIfNeeded = (eligible: boolean) => {
  if (!eligible && route.query.tab === 'usage') {
    void router.replace(getOrdersPath())
  }
}

watch(
  () => [profileUserId.value, isPreviewAccessGranted.value] as const,
  ([uid, granted]) => {
    if (uid === '' || !granted) {
      showUsage.value = false
      return
    }
    void fetchEnterpriseUsageTabEligible(uid)
      .then((eligible) => {
        showUsage.value = eligible
        normalizeUsageTabUrlIfNeeded(eligible)
      })
      .catch(() => {
        showUsage.value = false
        normalizeUsageTabUrlIfNeeded(false)
      })
  },
  { immediate: true },
)

watch(
  () => [route.query.tab, showUsage.value] as const,
  async ([tab, usageVisible]) => {
    if (tab !== 'usage' || !usageVisible) return
    await nextTick()
    usageSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  },
  { immediate: true },
)

const profileFilter = computed(() => {
  const id = enterpriseId.value
  if (id == null || id === '') {
    return { kind: 'none' as const }
  }
  return { kind: 'enterprise' as const, enterpriseId: id }
})

const canShowOrders = computed(() => enterpriseId.value != null && isPreviewAccessGranted.value)
</script>

<template>
  <v-container v-if="isProfileGateLoading" class="d-flex align-center justify-center" style="min-height: 60vh">
    <v-progress-circular indeterminate color="primary" size="48" />
  </v-container>
  <v-container v-else-if="isProfileAccessDenied" class="d-flex align-center justify-center" style="min-height: 60vh">
    <p class="text-body-1 text-medium-emphasis">{{ $t('user_profile.access_denied') }}</p>
  </v-container>
  <v-container v-else-if="isInvalidProfile" class="d-flex align-center justify-center" style="min-height: 60vh">
    <p class="text-body-1 text-medium-emphasis">{{ $t('user_profile.user_not_found') }}</p>
  </v-container>
  <v-container v-else-if="previewError != null" class="d-flex align-center justify-center" style="min-height: 60vh">
    <p class="text-body-1 text-medium-emphasis">{{ $t('user_profile.failed_to_load') }}</p>
  </v-container>
  <Orders
    v-else-if="canShowOrders"
    :profile-filter="profileFilter"
    :resolve-event-path="getEventPath"
    :resolve-receipt-path="getReceiptPath"
    hide-share-sns
  >
    <template v-if="showUsage" #prepend>
      <div ref="usageSection" class="mb-6">
        <EnterpriseSubsidyUsagePanel />
      </div>
    </template>
  </Orders>
</template>
