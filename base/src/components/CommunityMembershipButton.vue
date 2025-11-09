<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useCommunityStore } from '@shokujii/base/stores/community'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'

type ButtonProps = Record<string, unknown>

const props = defineProps<{
  communityId: string
  joinButtonProps?: ButtonProps
  leaveButtonProps?: ButtonProps
  block?: boolean
}>()

const emit = defineEmits<{
  (event: 'membership-change', payload: { isMember: boolean }): void
}>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const userStore = useCurrentUserStore()
const communityStore = useCommunityStore(props.communityId)

const isMember = ref(false)
const isManager = ref(false)
const isLoading = ref(false)
const snackbarState = reactive({
  visible: false,
  color: 'success' as 'success' | 'error',
  message: '',
})

const loginConfirmState = reactive({
  dialog: false,
  message: '',
})

const block = computed(() => props.block ?? false)

const computedJoinButtonProps = computed<ButtonProps>(() => ({
  variant: 'outlined',
  size: 'small',
  rounded: 'pill',
  color: 'primary',
  ...(props.joinButtonProps ?? {}),
}))

const computedLeaveButtonProps = computed<ButtonProps>(() => ({
  variant: 'outlined',
  size: 'small',
  rounded: 'pill',
  color: 'secondary',
  ...(props.leaveButtonProps ?? {}),
}))

const updateMembershipState = () => {
  const uid = userStore.firebaseUser?.uid
  const community = communityStore.community

  if (uid == null || community == null) {
    isMember.value = false
    isManager.value = false
    return
  }

  const memberMatch = community.members?.some((memberRef) => memberRef.id === uid) ?? false
  const managerMatch = community.managers?.some((managerRef) => managerRef.id === uid) ?? false
  isMember.value = memberMatch
  isManager.value = managerMatch
}

watchEffect(updateMembershipState)

watch(
  () => isMember.value,
  (value) => {
    emit('membership-change', { isMember: value })
  },
  { immediate: true },
)

const openLoginConfirm = (message: string) => {
  loginConfirmState.message = message
  loginConfirmState.dialog = true
}

const redirectToLogin = () => {
  router.push({
    path: '/login',
    query: { redirect: route.fullPath },
  })
}

const showSnackbar = (message: string, color: 'success' | 'error' = 'success') => {
  snackbarState.message = message
  snackbarState.color = color
  snackbarState.visible = true
}

const joinCommunity = async () => {
  if (userStore.firebaseUser == null) {
    openLoginConfirm(t('community_membership.login_confirm_join'))
    return
  }
  if (isLoading.value) return

  isLoading.value = true
  try {
    await communityStore.joinCommunity()
    isMember.value = true
    showSnackbar(t('community_membership.join_success'), 'success')
  } catch (error) {
    const message = (error as Error)?.message
    if (message === 'not-logged-in') {
      openLoginConfirm(t('community_membership.login_confirm_join'))
    } else {
      console.error(error)
      showSnackbar(t('community_membership.error_generic'), 'error')
    }
  } finally {
    isLoading.value = false
  }
}

const leaveCommunity = async () => {
  if (userStore.firebaseUser == null) {
    openLoginConfirm(t('community_membership.login_confirm_leave'))
    return
  }
  if (isManager.value) {
    showSnackbar(t('community_membership.manager_leave_forbidden'), 'error')
    return
  }
  if (isLoading.value) return

  isLoading.value = true
  try {
    await communityStore.leaveCommunity()
    isMember.value = false
    showSnackbar(t('community_membership.leave_success'), 'success')
  } catch (error) {
    const message = (error as Error)?.message
    if (message === 'manager-cannot-leave') {
      showSnackbar(t('community_membership.manager_leave_forbidden'), 'error')
    } else if (message === 'not-logged-in') {
      openLoginConfirm(t('community_membership.login_confirm_leave'))
    } else {
      console.error(error)
      showSnackbar(t('community_membership.error_generic'), 'error')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="community-membership-button">
    <v-btn
      v-if="isMember"
      v-bind="computedLeaveButtonProps"
      :block="block"
      :loading="isLoading"
      :disabled="isLoading"
      @click="leaveCommunity"
    >
      <slot name="leave-label">{{ t('community_membership.leave') }}</slot>
    </v-btn>
    <v-btn
      v-else
      v-bind="computedJoinButtonProps"
      :block="block"
      :loading="isLoading"
      :disabled="isLoading"
      @click="joinCommunity"
    >
      <slot name="join-label">{{ t('community_membership.join') }}</slot>
    </v-btn>

    <confirm-dialog v-model="loginConfirmState.dialog" :is-confirm="true" :ok-click="redirectToLogin">
      {{ loginConfirmState.message }}
    </confirm-dialog>

    <v-snackbar v-model="snackbarState.visible" :color="snackbarState.color" location="top">
      {{ snackbarState.message }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.community-membership-button {
  width: 100%;
}
</style>
