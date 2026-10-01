<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { FirebaseError } from 'firebase/app'
import FormAnswerFields from '@shokujii/base/components/forms/FormAnswerFields.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { getOrderFormForCart, saveOrderFormAttempt } from '@shokujii/base/apis/form.js'
import { createStripeCheckoutSession } from '@shokujii/base/apis/stripe'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser'
import { useEventStore, buildEventStoreOptions } from '@shokujii/base/stores/event'
import { getAuth } from 'firebase/auth'
import { computeTotalPayment } from '@shokujii/common/utils/paymentCommunityBillOffAmount.js'
import { isWithinOrderDeadline } from '@shokujii/common/utils/orderDeadline.js'
import { sortOrderIdsForEnterpriseSubsidyReplay } from '@shokujii/common/utils/eventMemberOrderSort.js'
import { getUserFacingFailedPreconditionMessage } from '@shokujii/common/utils/failedPreconditionMessage.js'
import { getEventPath } from '@/router/utils'
import type { ResolveOrdersPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import type { FormAnswerInput, FormValidationIssue } from '@shokujii/common/utils/validateFormAnswers.js'
import type { FormField } from '@shokujii/common/schemas/formFields.js'
import type { GetOrderFormForCartResponse } from '@shokujii/common/apis/form.js'

const props = defineProps<{
  eventId: string
  resolveOrdersPath: ResolveOrdersPathFn
  resolveCartPath: () => string
}>()

const { t: $t } = useI18n()
const router = useRouter()
const { cart } = storeToRefs(useCurrentUserStore())

const loading = ref(true)
const saving = ref(false)
const form = ref<GetOrderFormForCartResponse | null>(null)
const answers = ref<FormAnswerInput[]>([])
const issues = ref<FormValidationIssue[]>([])
const alertMessage = ref('')
const isOpenAlert = ref(false)
const openConfirmOrder = ref(false)
const confirmDialogMessage = ref('')

const showAlert = (message: string) => {
  alertMessage.value = message
  isOpenAlert.value = true
}

const cartItem = computed(() => cart.value?.find((item) => item.event.event_id === props.eventId))
const fields = computed<FormField[]>(() => form.value?.fields ?? [])

const needsStripe = computed(() => {
  const item = cartItem.value
  if (item == null) {
    return false
  }
  if (item.event.event_payment === 'user_advance') {
    return true
  }
  if (item.event.event_payment === 'community_bill' && item.event.community_bill_settings?.type === 'discount') {
    return computeTotalPayment(item.orders) > 0
  }
  return false
})

const load = async () => {
  const item = cartItem.value
  if (item == null) {
    loading.value = false
    showAlert($t('cart.form_load_failed'))
    return
  }
  loading.value = true
  try {
    const response = await getOrderFormForCart({
      community_id: item.event.community_id,
      event_id: item.event.event_id,
    })
    form.value = response.data
    answers.value = response.data.initial_answers ?? []
    if (!response.data.has_form) {
      void router.replace(props.resolveCartPath())
    }
  } catch {
    showAlert($t('cart.form_load_failed'))
  } finally {
    loading.value = false
  }
}

watch(
  cartItem,
  () => {
    void load()
  },
  { immediate: true },
)

const getOrderErrorMessage = (error: unknown): string | null => {
  if (error instanceof FirebaseError && error.code === 'functions/failed-precondition') {
    return getUserFacingFailedPreconditionMessage(error.message)
  }
  if (error instanceof Error) {
    return getUserFacingFailedPreconditionMessage(error.message)
  }
  return null
}

const persistAttempt = async (): Promise<string | null> => {
  const item = cartItem.value
  const current = form.value
  if (item == null || current?.definition_version == null) {
    return null
  }
  const response = await saveOrderFormAttempt({
    community_id: item.event.community_id,
    event_id: item.event.event_id,
    definition_version: current.definition_version,
    answers: answers.value,
  })
  if (response.data.issues != null && response.data.issues.length > 0) {
    issues.value = response.data.issues
    return null
  }
  issues.value = []
  return response.data.attempt_id
}

const startOrder = async (attemptId: string) => {
  const item = cartItem.value
  if (item == null) {
    return
  }
  if (!isWithinOrderDeadline(item.event.event_deadline_datetime)) {
    showAlert($t('cart.cannot_order_deadline'))
    return
  }
  const orderIds = sortOrderIdsForEnterpriseSubsidyReplay(item.orders)
  if (needsStripe.value) {
    try {
      const response = await createStripeCheckoutSession({
        community_id: item.event.community_id,
        event_id: item.event.event_id,
        order_ids: orderIds,
        isPosted: false,
        origin: window.location.origin,
        form_attempt_id: attemptId,
      })
      window.location.href = response.data.url ?? getEventPath(item.event.community_account, item.event.event_id)
    } catch (error) {
      showAlert(getOrderErrorMessage(error) ?? $t('cart.payment_failed'))
    }
    return
  }
  try {
    const auth = getAuth()
    const user = auth.currentUser
    const token = user == null ? undefined : await user.getIdTokenResult()
    const eventStore = useEventStore(
      item.event.event_id,
      buildEventStoreOptions(token?.claims.enterprise_id as string | undefined),
    )
    await eventStore.confirmOrder({
      community_id: item.event.community_id,
      event_id: item.event.event_id,
      order_ids: orderIds,
      form_attempt_id: attemptId,
    })
    await router.push(
      props.resolveOrdersPath({ eventId: item.event.event_id, communityAccount: item.event.community_account }),
    )
  } catch (error) {
    showAlert(getOrderErrorMessage(error) ?? $t('cart.order_failed'))
  }
}

const onPrimary = async () => {
  saving.value = true
  try {
    const attemptId = await persistAttempt()
    if (attemptId == null) {
      if (issues.value.length === 0) {
        showAlert($t('cart.form_save_failed'))
      }
      return
    }
    if (needsStripe.value) {
      await startOrder(attemptId)
      return
    }
    confirmDialogMessage.value =
      cartItem.value?.event.event_payment === 'user_on_day'
        ? $t('cart.confirm_order_participant_on_day')
        : $t('cart.confirm_order_community_bill')
    pendingAttemptId.value = attemptId
    openConfirmOrder.value = true
  } catch (error) {
    showAlert(getOrderErrorMessage(error) ?? $t('cart.form_save_failed'))
  } finally {
    saving.value = false
  }
}

const pendingAttemptId = ref('')

const confirmOrderNow = async () => {
  saving.value = true
  try {
    await startOrder(pendingAttemptId.value)
  } finally {
    saving.value = false
    openConfirmOrder.value = false
  }
}
</script>

<template>
  <v-container class="manage-container py-8" style="max-width: 720px">
    <div class="text-h5 mb-2">{{ $t('cart.form_page_title') }}</div>
    <div v-if="form?.purpose" class="text-body-1 mb-6">{{ form.purpose }}</div>
    <v-progress-circular v-if="loading" indeterminate color="primary" />
    <template v-else-if="form?.has_form">
      <FormAnswerFields v-model="answers" :fields="fields" :issues="issues" />
      <v-btn class="mt-8" color="grey-900" size="x-large" rounded="pill" block :loading="saving" @click="onPrimary">
        {{ needsStripe ? $t('cart.proceed_to_payment') : $t('cart.order_and_attend_event') }}
      </v-btn>
      <v-btn class="mt-4" variant="text" block @click="router.push(resolveCartPath())">{{
        $t('cart.back_to_cart')
      }}</v-btn>
    </template>
    <ConfirmDialog v-model="openConfirmOrder" :is-confirm="true" :ok-click="confirmOrderNow" :ok-loading-state="saving">
      {{ confirmDialogMessage }}
    </ConfirmDialog>
    <ConfirmDialog v-model="isOpenAlert" :is-confirm="false">{{ alertMessage }}</ConfirmDialog>
  </v-container>
</template>
