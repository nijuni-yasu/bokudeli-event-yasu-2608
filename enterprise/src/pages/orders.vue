<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import Orders from '@shokujii/base/components/pages/orders.vue'
import { getEventPath, getReceiptPath } from '@/router/utils'
import EnterpriseSubsidyUsagePanel from '@/components/profile/EnterpriseSubsidyUsagePanel.vue'
import { useEnterpriseId } from '@/composable/useEnterpriseId'
import { fetchEnterpriseUsageTabEligible } from '@/composable/enterpriseMemberMonthlyUsage.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'

const route = useRoute()
const { enterpriseId } = useEnterpriseId()
const { user: loginUser } = storeToRefs(useCurrentUserStore())

const showUsage = ref(false)
const usageSection = ref<HTMLElement | null>(null)

watch(
  () => loginUser.value?.user_id,
  (uid) => {
    if (uid == null || uid === '') {
      showUsage.value = false
      return
    }
    void fetchEnterpriseUsageTabEligible(uid).then((eligible) => {
      showUsage.value = eligible
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
</script>

<template>
  <Orders
    v-if="enterpriseId != null"
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
