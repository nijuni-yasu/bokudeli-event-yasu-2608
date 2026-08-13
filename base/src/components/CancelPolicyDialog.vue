<script setup lang="ts">
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getLogin, getOrdersPath } from '@/router/utils'

const isOpenDialog = defineModel<boolean>({ required: true })
const { firebaseUser } = storeToRefs(useCurrentUserStore())

const ordersTabTo = computed(() => {
  if (firebaseUser.value?.uid == null) return getLogin()
  return getOrdersPath()
})

const closeDialog = () => {
  isOpenDialog.value = false
}
</script>

<template>
  <confirm-dialog v-model="isOpenDialog" :is-confirm="false">
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('cancelpolicy_modal.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2rem">
      <div>
        <span v-html="$t('cancelpolicy_modal.desc_before')" />
        <router-link :to="ordersTabTo" class="text-primary text-decoration-none" @click="closeDialog">
          {{ $t('cancelpolicy_modal.orders_link') }}
        </router-link>
        {{ $t('cancelpolicy_modal.desc_after') }}
      </div>
    </v-card-text>
  </confirm-dialog>
</template>
