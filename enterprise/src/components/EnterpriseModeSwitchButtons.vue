<script setup lang="ts">
import { mdiPartyPopper } from '@mdi/js'
import { getAuth } from 'firebase/auth'
import { hasManagedCommunityInEnterprise } from '@shokujii/base/stores/community.js'
import { getAdminSettingsPath, getHomePath, getManageNewCommunityPath, getManagePath } from '@/router/utils'
import { isEnterpriseAdmin } from '@/composable/useEnterpriseAdmin'
import { useEnterpriseId } from '@/composable/useEnterpriseId'

type EnterpriseMode = 'default' | 'manage' | 'admin'

defineProps<{
  mode: EnterpriseMode
}>()

const router = useRouter()
const showAdminButton = ref(false)
const { enterpriseId } = useEnterpriseId()

onMounted(async () => {
  showAdminButton.value = await isEnterpriseAdmin()
})

const handleEventHostClick = async () => {
  const uid = getAuth().currentUser?.uid
  if (uid == null) return

  const resolvedEnterpriseId = enterpriseId.value
  if (resolvedEnterpriseId == null) {
    router.push(getManageNewCommunityPath())
    return
  }

  const hasCommunity = await hasManagedCommunityInEnterprise(uid, resolvedEnterpriseId)
  router.push(hasCommunity ? getManagePath() : getManageNewCommunityPath())
}
</script>

<template>
  <template v-if="mode === 'default'">
    <v-btn class="event-host-cta me-4" :append-icon="mdiPartyPopper" @click="handleEventHostClick">
      {{ $t('navigation.new_event') }}
    </v-btn>
    <v-btn v-if="showAdminButton" class="me-4" :to="getAdminSettingsPath()">
      {{ $t('admin.navigation.portal') }}
    </v-btn>
  </template>

  <template v-else-if="mode === 'manage'">
    <v-btn class="me-4" :to="getHomePath()">
      {{ $t('navigation.home') }}
    </v-btn>
    <v-btn v-if="showAdminButton" class="me-4" :to="getAdminSettingsPath()">
      {{ $t('admin.navigation.portal') }}
    </v-btn>
  </template>

  <template v-else-if="mode === 'admin'">
    <v-btn class="me-4" :to="getHomePath()">
      {{ $t('navigation.home') }}
    </v-btn>
    <v-btn class="event-host-cta me-4" :append-icon="mdiPartyPopper" @click="handleEventHostClick">
      {{ $t('navigation.new_event') }}
    </v-btn>
  </template>
</template>

<style lang="scss" scoped>
.event-host-cta {
  background: linear-gradient(
    -72.47deg,
    rgb(var(--v-global-theme-primary)) 22.16%,
    rgba(var(--v-global-theme-primary), 0.7) 76.47%
  ) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    width: 50%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
    animation: event-host-shimmer 5.5s ease-in-out infinite;
  }

  :deep(.v-btn__content),
  :deep(.v-icon) {
    position: relative;
    z-index: 1;
  }

  :deep(.v-icon) {
    color: rgb(var(--v-theme-on-primary)) !important;
  }
}

@keyframes event-host-shimmer {
  0% {
    transform: translateX(-100%);
  }
  18% {
    transform: translateX(200%);
  }
  100% {
    transform: translateX(200%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .event-host-cta::before {
    animation: none;
    display: none;
  }
}
</style>
