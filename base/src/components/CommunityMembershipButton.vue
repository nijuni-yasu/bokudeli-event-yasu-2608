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
  'membership-change': [isMember: boolean]
}>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const userStore = useCurrentUserStore()
const communityStore = useCommunityStore(props.communityId)

const isMember = ref(false)
const isManager = ref(false)
const isLoading = ref(false)
const membershipPendingAction = ref<null | 'join' | 'leave'>(null)
const isLeaveHover = ref(false)
const leaveConfirmDialog = ref(false)
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

const isMemberForUi = computed(() => {
  if (membershipPendingAction.value === 'join') {
    return true
  }
  if (membershipPendingAction.value === 'leave') {
    return false
  }
  return isMember.value
})

const isBusy = computed(() => isLoading.value || membershipPendingAction.value !== null)

const computedJoinButtonProps = computed<ButtonProps>(() => ({
  size: 'small',
  rounded: 'pill',
  color: 'primary',
  ...(props.joinButtonProps ?? {}),
}))

const computedLeaveButtonProps = computed<ButtonProps>(() => ({
  variant: 'outlined',
  size: 'small',
  rounded: 'pill',
  ...(props.leaveButtonProps ?? {}),
}))

const leaveButtonColor = computed(() => (isLeaveHover.value ? 'secondary' : 'primary'))

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
  (value: boolean) => {
    if (membershipPendingAction.value === 'join' && value) {
      membershipPendingAction.value = null
    } else if (membershipPendingAction.value === 'leave' && !value) {
      membershipPendingAction.value = null
    }
  },
  { immediate: true },
)

watch(
  () => isMemberForUi.value,
  (value: boolean) => {
    emit('membership-change', value)
    if (!value) {
      isLeaveHover.value = false
    }
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
  if (isBusy.value) return

  membershipPendingAction.value = 'join'
  isLoading.value = true
  try {
    await communityStore.joinCommunity()
    showSnackbar(t('community_membership.join_success'), 'success')
  } catch (error) {
    membershipPendingAction.value = null
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

const handleLeaveButtonClick = () => {
  if (isBusy.value) return

  if (userStore.firebaseUser == null) {
    openLoginConfirm(t('community_membership.login_confirm_leave'))
    return
  }

  leaveConfirmDialog.value = true
}

const confirmLeaveCommunity = async () => {
  await leaveCommunity()
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
  if (isBusy.value) return

  membershipPendingAction.value = 'leave'
  isLoading.value = true
  try {
    await communityStore.leaveCommunity()
    showSnackbar(t('community_membership.leave_success'), 'success')
  } catch (error) {
    membershipPendingAction.value = null
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
      v-if="isMemberForUi"
      v-bind="computedLeaveButtonProps"
      :block="block"
      :color="leaveButtonColor"
      :loading="isBusy"
      :disabled="isBusy"
      @mouseover="isLeaveHover = true"
      @mouseleave="isLeaveHover = false"
      @focus="isLeaveHover = true"
      @blur="isLeaveHover = false"
      @click="handleLeaveButtonClick"
    >
      <slot name="leave-label">
        {{ isLeaveHover ? t('community_membership.leave') : t('community_membership.active') }}
      </slot>
    </v-btn>
    <v-btn
      v-else
      v-bind="computedJoinButtonProps"
      :block="block"
      :loading="isBusy"
      :disabled="isBusy"
      @click="joinCommunity"
    >
      <slot name="join-label">{{ t('community_membership.join') }}</slot>
    </v-btn>

    <confirm-dialog v-model="loginConfirmState.dialog" :is-confirm="true" :ok-click="redirectToLogin">
      {{ loginConfirmState.message }}
    </confirm-dialog>
    <confirm-dialog v-model="leaveConfirmDialog" :is-confirm="true" :ok-click="confirmLeaveCommunity">
      {{ t('community_membership.leave_confirm') }}
    </confirm-dialog>

    <v-snackbar v-model="snackbarState.visible" :color="snackbarState.color" location="top">
      {{ snackbarState.message }}
    </v-snackbar>
  </div>
</template>
