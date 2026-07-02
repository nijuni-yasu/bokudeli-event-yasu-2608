<script setup lang="ts">
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { getLogin, getRegister } from '@/router/utils'

export type AuthEntryMode = 'login' | 'register'

defineProps<{
  mode: AuthEntryMode
}>()

const { t: $t } = useI18n()
</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-5 pa-0">
      <v-col lg="5" md="6" sm="10" cols="12" class="pa-0">
        <div class="auth-entry-shell" :class="`auth-entry-shell--${mode}`">
          <v-row justify="center" class="mb-0">
            <v-img max-width="100" :src="logo" />
          </v-row>

          <v-row justify="center" class="mt-4 mb-0">
            <div class="auth-brand-welcome text-h4 font-weight-bold text-medium-emphasis text-center">
              {{ mode === 'login' ? $t('login.brand_welcome') : $t('register.brand_welcome') }}
            </div>
          </v-row>

          <v-tabs
            :model-value="mode"
            class="auth-folder-tabs mt-6"
            grow
            hide-slider
            selected-class="auth-folder-tab--active"
          >
            <v-tab value="login" :to="getLogin()" :ripple="false">
              {{ $t('login.title') }}
            </v-tab>
            <v-tab value="register" :to="getRegister()" :ripple="false">
              {{ $t('register.title') }}
            </v-tab>
          </v-tabs>

          <v-sheet class="auth-folder-card py-14 px-sm-12 px-5" elevation="0">
            <v-container class="mb-2">
              <v-row justify="center" class="py-5 text-subtitle-1">
                <slot name="description" />
              </v-row>
            </v-container>

            <slot />

            <template v-if="$slots.footer">
              <v-container class="auth-entry-footer text-subtitle-1 pt-8">
                <slot name="footer" />
              </v-container>
            </template>
          </v-sheet>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.auth-entry-shell {
  --auth-tab-radius: 12px;
  --auth-tab-text-color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.auth-folder-tabs.v-tabs.v-tabs--horizontal {
  width: 100%;
  border-block-end: none;
  --v-tabs-height: auto;
}

.auth-folder-tabs :deep(.v-slide-group),
.auth-folder-tabs :deep(.v-slide-group__container),
.auth-folder-tabs :deep(.v-slide-group__content) {
  width: 100%;
}

.auth-folder-tabs :deep(.v-slide-group__content) {
  gap: 0;
}

.auth-folder-tabs :deep(.v-tab.v-btn) {
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
  height: auto;
  min-height: 60px;
  letter-spacing: normal;
  text-transform: none;
  font-size: 1rem;
  line-height: 1.4;
  padding-block: 20px 18px !important;
  padding-inline: 16px !important;
  border: none;
  background-color: rgb(var(--v-theme-grey-100));
  color: var(--auth-tab-text-color);
  opacity: 1;
}

.auth-folder-tabs :deep(.v-tab.v-btn:first-child) {
  border-radius: var(--auth-tab-radius) 0 0 0;
}

.auth-folder-tabs :deep(.v-tab.v-btn:last-child) {
  border-radius: 0 var(--auth-tab-radius) 0 0;
}

.auth-folder-tabs :deep(.v-tab.v-btn.v-tab--selected),
.auth-folder-tabs :deep(.v-tab.v-btn.auth-folder-tab--active) {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: var(--auth-tab-text-color) !important;
  font-weight: 600;
  z-index: 1;
  margin-bottom: -1px;
}

.auth-folder-tabs :deep(.v-tab.v-btn:not(.v-tab--selected):hover) {
  color: var(--auth-tab-text-color);
}

.auth-folder-tabs :deep(.v-tab.v-btn.v-tab--selected .v-btn__overlay),
.auth-folder-tabs :deep(.v-tab.v-btn.auth-folder-tab--active .v-btn__overlay) {
  opacity: 0;
}

.auth-folder-tabs :deep(.v-tab__slider) {
  display: none;
}

.auth-folder-card {
  position: relative;
  z-index: 0;
  border: none;
  border-radius: 0 0 var(--auth-tab-radius) var(--auth-tab-radius);
  background: rgb(var(--v-theme-surface));
}

.auth-brand-welcome {
  line-height: 1.4;
}
</style>
