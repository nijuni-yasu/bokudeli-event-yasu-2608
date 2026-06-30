<script setup lang="ts">
import { mdiSilverwareForkKnife, mdiPartyPopper, mdiViewDashboard } from '@mdi/js'
import { getAdminDashboardPath, getHomePath, getManagePath } from '@/router/utils'
import { isEnterpriseAdmin } from '@/composable/useEnterpriseAdmin'

type EnterpriseMode = 'manage' | 'admin'

defineProps<{
  mode: EnterpriseMode
}>()

const showAdminButton = ref(false)

onMounted(async () => {
  showAdminButton.value = await isEnterpriseAdmin()
})
</script>

<template>
  <template v-if="mode === 'manage'">
    <v-btn
      class="enterprise-header-nav-btn me-4"
      variant="flat"
      rounded="pill"
      :prepend-icon="mdiSilverwareForkKnife"
      :to="getHomePath()"
    >
      {{ $t('navigation.home') }}
    </v-btn>
    <v-btn
      v-if="showAdminButton"
      class="enterprise-header-nav-btn me-4"
      variant="flat"
      rounded="pill"
      :prepend-icon="mdiViewDashboard"
      :to="getAdminDashboardPath()"
    >
      {{ $t('admin.navigation.portal') }}
    </v-btn>
  </template>

  <template v-else-if="mode === 'admin'">
    <v-btn
      class="enterprise-header-nav-btn me-4"
      variant="flat"
      rounded="pill"
      :prepend-icon="mdiSilverwareForkKnife"
      :to="getHomePath()"
    >
      {{ $t('navigation.home') }}
    </v-btn>
    <v-btn
      class="enterprise-header-nav-btn me-4"
      variant="flat"
      rounded="pill"
      :prepend-icon="mdiPartyPopper"
      :to="getManagePath()"
    >
      {{ $t('navigation.new_event') }}
    </v-btn>
  </template>
</template>

<style lang="scss" scoped>
// 参加者画面グローバルメニューの %nav-link-active / %horizontal-nav-top-level-item と同系統
.enterprise-header-nav-btn {
  background: linear-gradient(
    -72.47deg,
    rgb(var(--v-global-theme-primary)) 22.16%,
    rgba(var(--v-global-theme-primary), 0.7) 76.47%
  ) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);

  :deep(.v-btn__content),
  :deep(.v-icon) {
    color: rgb(var(--v-theme-on-primary)) !important;
  }
}
</style>
