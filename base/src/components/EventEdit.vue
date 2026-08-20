<script setup lang="ts">
import { ref, shallowRef, reactive, computed, watch, onMounted, onUnmounted, toRaw } from 'vue'
import { DateTime } from 'luxon'
import { isInShopTime } from '@shokujii/common/utils/datetime.js'
import {
  validateReservationRequest,
  type ReservationRequestReasonCode,
} from '@shokujii/common/utils/validateReservationRequest.js'
import { getReservationLeadTimeMinDateString } from '@shokujii/common/utils/reservationLeadTime.js'
import { reasonCodesToMessages } from '@shokujii/base/utils/reservationRequestMessages'
import {
  collectEventBasicInfoValidationMessages,
  collectEventDetailValidationMessages,
} from '@shokujii/base/utils/eventEditValidationMessages'
import EventBasicInfoCard from '@shokujii/base/components/eventcreate/EventBasicInfoCard.vue'
import EventShop from '@shokujii/base/components/eventcreate/EventShop.vue'
import EventMenu from '@shokujii/base/components/eventcreate/EventMenu.vue'
import EventDetailCard from '@shokujii/base/components/eventcreate/EventDetailCard.vue'
import EventShopNotice from '@shokujii/base/components/eventcreate/EventShopNotice.vue'
import EventEditStepNav from '@shokujii/base/components/eventcreate/EventEditStepNav.vue'
import { eventPaymentUiStrategyFromEnterpriseId } from '@shokujii/base/composable/eventPaymentUiStrategy.js'
import { eventDraftPreparerFromEnterpriseId } from '@shokujii/base/stores/eventDraft.js'
import { BokudeliEvent, createNewEvent, updateEventMenus } from '@shokujii/base/stores/event.js'
import { usePartnerStore, type BokudeliPartnerMenu, type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { BokudeliEventMenu } from '@shokujii/base/stores/event'
import { useAppCommunityStore } from '@shokujii/base/composable/useAppCommunityStore.js'
import { useCreateAppEventStore } from '@shokujii/base/composable/useAppEventStore.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useShopListStore } from '@shokujii/base/stores/shopList'
import {
  convertPartnerMenusToEventMenus,
  updateEventMenusIsSelected,
  shouldRegenerateFromPartnerMenus,
  shouldUpdateExistingMenusOnly,
} from '@shokujii/common/utils/eventMenuConverter.js'
import { useRouter } from 'vue-router'
import { getCommunityPath, getManageCommunityAlbumPath } from '@/router/utils'
import { fetchLocationByPostalcode, LatLogLocation } from '@shokujii/base/utils/fetchLocation'
import { updateEventDeadlineFromShop } from '@shokujii/common/utils/eventShopDeadline.js'
import {
  applyMinimumParticipantsForEventSave,
  MinimumParticipantsSaveError,
} from '@shokujii/common/utils/minimumParticipants.js'
import {
  getDeliverablePartnerShopsSorted,
  isPartnerShopIdDeliverableAt,
} from '@shokujii/common/utils/partnerShopDeliverable.js'
import { isAddressBaseValidForPostalcode } from '@shokujii/base/utils/isAddressBaseValidForPostalcode'
import { useValidators } from '@shokujii/base/composable/validators'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { mdiChevronLeft, mdiChevronRight, mdiEmailOutline } from '@mdi/js'

import { useI18n } from 'vue-i18n'
const { t: $t } = useI18n()
const { show: showNotification } = useNotification()

const router = useRouter()

const props = defineProps<{
  communityAccount: string
  eventId?: string
  step?: string
}>()

const emits = defineEmits<{
  updated: [id: string]
}>()

const {
  requiredValidator,
  postalCodeValidator,
  urlValidator,
  requiredHtmlValidator,
  positiveIntegerValidator,
  emailValidator,
} = useValidators()

const alertDialog = reactive({
  visible: false,
  message: '',
  onClose: undefined as (() => void) | undefined,
})

const reserveValidationDialog = reactive({
  visible: false,
  messages: [] as string[],
})

const step1ValidationDialog = reactive({
  visible: false,
  messages: [] as string[],
})

const step4ValidationDialog = reactive({
  visible: false,
  messages: [] as string[],
})

const step1FormRef = ref<{ validate: () => Promise<{ valid: boolean }> }>()
const step4FormRef = ref<{ validate: () => Promise<{ valid: boolean }> }>()

const showAlertDialog = (message: string, onClose?: () => void) => {
  alertDialog.message = message
  alertDialog.visible = true
  alertDialog.onClose = onClose
}

const handleAlertDialogOk = () => {
  const onClose = alertDialog.onClose
  alertDialog.onClose = undefined
  onClose?.()
}

const isValid1 = ref(false)
const isValid4 = ref(false)

type ProcessingState = null | 'creating' | 'saving' | 'submitting' | 'reserving'
const processingState = ref<ProcessingState>(null)
const isProcessing = computed(() => processingState.value != null)

/** 新規ウィザードで Step 3 の初回 Firestore 作成が完了したか */
const hasFirestoreDraft = ref(false)

const shopNoticeRef = shallowRef<{
  openReserveConfirmDialog: () => void
  validateForm: () => Promise<{ valid: boolean } | undefined>
} | null>(null)

const communityStore = useAppCommunityStore(props.communityAccount)
const createAppEventStore = useCreateAppEventStore()

const paymentUiStrategy = computed(() =>
  eventPaymentUiStrategyFromEnterpriseId(communityStore.community?.enterprise_id),
)

const isContactDialogOpen = ref(props.eventId == null)

const _event = ref<BokudeliEvent | null>(null)

/** 非同期初期化の取り違え防止（コミュニティ切り替え・二重実行） */
let communityInitSerial = 0

// Initialize _event when community data becomes available
watch(
  () => communityStore.community,
  (community) => {
    if (props.eventId != null || community == null || _event.value != null) {
      return
    }
    const serial = ++communityInitSerial
    const communityName = community.community_name || ''
    const eventName = communityName ? `${communityName}のイベント` : ''
    const eventDesc = communityName ? `${communityName}のイベント` : ''
    const draftPayment = eventPaymentUiStrategyFromEnterpriseId(community.enterprise_id).defaultPaymentWhenDraft

    // PostcodeJP 待ちで画面全体がブロックされないよう、先にイベントを生成する
    _event.value = new BokudeliEvent(community.community_id, null, {
      community_id: community.community_id,
      community_name: community.community_name,
      community_account: community.community_account,
      organizer_fullname: community.community_manager_fullname,
      organizer_company: community.community_company,
      organizer_email: community.community_email,
      organizer_phone_company: community.community_phone,
      event_name: eventName,
      event_desc: eventDesc,
      ...(draftPayment != null ? { event_payment: draftPayment } : {}),
      ...(!eventPaymentUiStrategyFromEnterpriseId(community.enterprise_id).isEnterpriseMode
        ? { members_visible_min_count: 3 }
        : {}),
    })

    // コミュニティの郵便番号と住所をPostcodeJP APIから取得して、イベントの郵便番号と住所にコピー
    void (async () => {
      const addressBaseValid = await isAddressBaseValidForPostalcode(
        community.community_postalcode,
        community.community_address_base,
      )
      if (!addressBaseValid) {
        return
      }
      // 既存イベントの場合はコミュニティの郵便番号が変わっていたら上書きしない
      if (serial !== communityInitSerial || props.eventId != null) {
        return
      }
      if (_event.value == null) {
        return
      }
      // 非同期完了前にユーザーが郵便番号を入力していたら上書きしない
      if (_event.value.event_postalcode !== '') {
        return
      }
      _event.value.event_postalcode = community.community_postalcode
      _event.value.event_address_base = community.community_address_base
      _event.value.event_address_detail = community.community_address_detail
    })()
  },
  { immediate: true },
)

const event = computed<BokudeliEvent | null>({
  get: () => {
    if (props.eventId != null) {
      const eventStore = createAppEventStore(props.eventId)
      return eventStore.event
    } else {
      return _event.value
    }
  },
  set: (value) => {
    if (value == null) {
      return
    }
    if (props.eventId != null) {
      const eventStore = createAppEventStore(props.eventId)
      eventStore.event = value
    } else {
      _event.value = value
    }
  },
})

const albumManageUrl = computed(() => {
  const e = event.value
  return e != null ? getManageCommunityAlbumPath(e.community_account) : ''
})

const location = ref<LatLogLocation | null>(null)
watch(
  () => event.value?.event_postalcode,
  async (postalcode) => {
    if (requiredValidator(postalcode) !== true || postalCodeValidator(postalcode) !== true) {
      location.value = null
    } else {
      location.value = await fetchLocationByPostalcode(postalcode as string)
    }
  },
  { immediate: true },
)

const coverImage = ref<File | null>(null)

const partnerShopListStore = useShopListStore([])

type BokudeliPartnerShopWithExtras = BokudeliPartnerShop & {
  distance: number
  min_orders_on_spot: number
}
const shops = computed<BokudeliPartnerShopWithExtras[] | undefined>(() => {
  const selectedLocation = location.value
  if (selectedLocation == null) {
    return undefined
  }
  const list = getDeliverablePartnerShopsSorted(
    { longitude: selectedLocation.longitude, latitude: selectedLocation.latitude },
    event.value?.event_start_datetime,
    partnerShopListStore.shops ?? [],
  )
  return list as BokudeliPartnerShopWithExtras[]
})

const selectedShop = computed((): BokudeliPartnerShop | null => {
  if (event.value == null) {
    return null
  }
  return shops.value?.find((shop) => shop.shop_id === event.value?.shop_id) ?? null
})

/** マスタ一覧から event.shop_id に一致する店（一覧未取得時は null） */
const resolvedShopFromMaster = computed((): BokudeliPartnerShop | null => {
  const e = event.value
  if (e == null || e.shop_id === '') {
    return null
  }
  return partnerShopListStore.shops?.find((s) => s.shop_id === e.shop_id) ?? null
})

const handleStep2Next = () => {
  if (selectedShop.value == null) {
    return
  }
  const ev = event.value
  const shop = selectedShop.value
  if (ev != null) {
    updateEventDeadlineFromShop(ev, shop)
  }
  stepper.value++
}

const currentUserStore = useCurrentUserStore()

/**
 * 予約申請のリードタイム下限（JST 当日 0:00 + N 日後）。EventBasicInfoCard の picker 制約に使う。
 * computed のリアクティブ依存に現在時刻は入らないためマウント中の深夜またぎでは再計算されないが、
 * 送信時は submitReservation が押下時刻ベースで再判定するため UI と乖離しても安全側に倒れる。
 */
const minEventStartDate = computed<string>(() => getReservationLeadTimeMinDateString(Date.now()))

/** 予約申請ボタンの追加無効化条件: 必要なデータが未取得なら集約バリデーションを呼ばない */
const isReserveDataMissing = computed(() => {
  return (
    partnerShopListStore.totalCount == null ||
    currentUserStore.user == null ||
    currentUserStore.personalInformation == null ||
    location.value == null
  )
})

// @ts-expect-error parseInt can take no string params, then return NaN
const stepQuery = Number.parseInt(props.step)
const stepper = ref(Number.isNaN(stepQuery) ? 1 : stepQuery)

watch(
  stepper,
  (newVal) => {
    if (newVal !== 5 || event.value == null || event.value.organizer_memo !== '') return
    const address = [event.value.event_address_base, event.value.event_address_detail].filter(Boolean).join(' ')
    if (address) {
      event.value.organizer_memo = $t('event_edit.organizer_memo_default', { address })
    }
  },
  { immediate: true },
)

// partner_id に基づいて PartnerMenu を取得（null = 未取得）
const partnerMenus = computed<BokudeliPartnerMenu[] | null>(() => {
  const partnerId = event.value?.partner_id
  if (partnerId == null || partnerId === '') {
    return []
  }
  const partnerStore = usePartnerStore(partnerId)
  return partnerStore.menus ?? null
})

const persistedEventIdForMenus = computed(() => {
  if (props.eventId != null) {
    return props.eventId
  }
  if (hasFirestoreDraft.value && event.value != null) {
    return event.value.event_id
  }
  return null
})

// 既存EventMenusを取得（null = 未取得）
const existingMenus = computed<BokudeliEventMenu[] | null>(() => {
  const id = persistedEventIdForMenus.value
  if (id == null) {
    return []
  }
  const eventStore = createAppEventStore(id)
  return eventStore.menus ?? null
})

// ステータスに応じたメニューソースが未取得（null）の場合にローディング中と判定
const isLoadingMenu = computed(() => {
  const eventStatus = event.value?.event_status?.value
  if (shouldUpdateExistingMenusOnly(eventStatus)) {
    return existingMenus.value === null
  }
  if (shouldRegenerateFromPartnerMenus(eventStatus)) {
    return partnerMenus.value === null
  }
  return false
})

// ユーザーのメニュー選択状態を管理
const _userSelectedMenuIds = ref<string[] | null>(null)
const userSelectedMenuIds = computed<string[]>({
  get: () => {
    // _userSelectedMenuIds が null の場合は existingMenus から初期値を取得
    if (_userSelectedMenuIds.value === null) {
      const menuEventId = persistedEventIdForMenus.value
      if (menuEventId == null) {
        return []
      }
      return existingMenus.value?.filter((m) => m.is_selected).map((m) => m.menu_id) ?? []
    }
    return _userSelectedMenuIds.value
  },
  set: (value: string[]) => {
    _userSelectedMenuIds.value = value
  },
})

const normalizePostalDigits = (p: string | undefined): string => (p ?? '').replace(/\D/g, '')

/** 下書き時に店舗・メニュー選択を外し、締切を開始日時に揃える（店舗再選択後に updateEventDeadlineFromShop で上書き） */
const clearShopSelectionForDraft = (reason: 'postal' | 'incompatible_datetime'): void => {
  const e = event.value
  if (e == null || e.event_status?.value !== 'in_draft') {
    return
  }
  if (e.shop_id === '') {
    return
  }
  e.shop_id = ''
  e.partner_id = ''
  e.shop_name = ''
  _userSelectedMenuIds.value = null
  const start = e.event_start_datetime
  if (start != null && start > 0) {
    e.event_deadline_datetime = start
  }
  showNotification(
    reason === 'postal'
      ? $t('event_edit.shop_cleared_postal_changed')
      : $t('event_edit.shop_cleared_incompatible_datetime'),
    'warning',
  )
}

watch(
  () => event.value?.event_postalcode,
  (newPc, oldPc) => {
    const e = event.value
    if (e == null || e.event_status?.value !== 'in_draft') {
      return
    }
    if (oldPc === undefined) {
      return
    }
    if (normalizePostalDigits(newPc) === normalizePostalDigits(oldPc)) {
      return
    }
    if (e.shop_id === '') {
      return
    }
    clearShopSelectionForDraft('postal')
  },
)

watch(
  () => ({
    start: event.value?.event_start_datetime,
    shopId: event.value?.shop_id ?? '',
    shop: resolvedShopFromMaster.value,
    listLen: partnerShopListStore.shops?.length ?? 0,
  }),
  ({ start, shopId, shop }) => {
    const e = event.value
    if (e == null || shopId === '') {
      return
    }
    if (e.event_status?.value !== 'in_draft') {
      return
    }
    if (start == null || start === 0) {
      return
    }
    if (shop == null) {
      return
    }
    if (isInShopTime(start, shop)) {
      return
    }
    clearShopSelectionForDraft('incompatible_datetime')
  },
)

// 終了またはキャンセル済みのイベントは編集不可
const isFinished = computed(
  () => event.value?.calculatedEventStatus === 'finished' || event.value?.calculatedEventStatus === 'event_canceled',
)

// 表示用のEventMenus（converter経由で変換）
const eventMenus = computed(() => {
  const eventId = event.value?.event_id ?? 'temp'
  const eventStartDatetime = event.value?.event_start_datetime ?? null
  const eventStatus = event.value?.event_status?.value

  if (shouldUpdateExistingMenusOnly(eventStatus)) {
    if (existingMenus.value === null) return []
    const { updatedMenus } = updateEventMenusIsSelected(existingMenus.value, userSelectedMenuIds.value)
    return updatedMenus
  }

  if (shouldRegenerateFromPartnerMenus(eventStatus)) {
    if (partnerMenus.value === null) return []
    return convertPartnerMenusToEventMenus(partnerMenus.value, eventId, eventStartDatetime, userSelectedMenuIds.value)
  }

  return []
})

// 保存時はこのselectedMenuIds.valueをバックエンドに送信する
// userSelectedMenuIdsとの違い:
// - userSelectedMenuIds: ユーザーの選択意図を保持
// - selectedMenuIds: 実際の表示状態を反映
const selectedMenuIds = computed(() => {
  return eventMenus.value.filter((m: BokudeliEventMenu) => m.is_selected).map((m: BokudeliEventMenu) => m.menu_id)
})

const selectedMenuCount = computed(() => selectedMenuIds.value.length)

/** 予約申請ボタンの事前無効化（データ未取得・処理中・下書き以外） */
const isReserveButtonDisabled = computed(() => {
  return (
    event.value?.event_status?.value !== 'in_draft' ||
    isProcessing.value ||
    isLoadingMenu.value ||
    isReserveDataMissing.value
  )
})

const showReserveValidationFailure = (reasonCodes: ReservationRequestReasonCode[]) => {
  reserveValidationDialog.messages = reasonCodesToMessages(reasonCodes, $t)
  reserveValidationDialog.visible = true
}

const validateCurrentReservationRequest = (ev: BokudeliEvent) => {
  const handleUserId = currentUserStore.firebaseUser?.uid ?? ''
  const user = currentUserStore.user
  const personalInformation = currentUserStore.personalInformation
  const loc = location.value
  if (handleUserId === '' || user == null || personalInformation == null || loc == null) {
    return null
  }
  return validateReservationRequest({
    event: ev,
    handleUserId,
    user,
    personalInformation,
    authEmail: currentUserStore.firebaseUser?.email ?? null,
    eventMenus: eventMenus.value,
    partnerShops: partnerShopListStore.shops ?? [],
    location: { latitude: loc.latitude, longitude: loc.longitude },
    nowMillis: DateTime.now().toMillis(),
  })
}

const canUseSecondarySave = computed(() => {
  if (event.value == null) {
    return false
  }
  if (props.eventId != null) {
    return true
  }
  return hasFirestoreDraft.value
})

watch(
  () => communityStore.community?.is_approved,
  (is_approved) => {
    if (is_approved === false) {
      showAlertDialog($t('manage.event.community_not_approved'), () => {
        router.push(getCommunityPath(props.communityAccount))
      })
    }
  },
  { immediate: true },
)

// メニュー選択IDの更新ハンドラ
const handleMenuIdsUpdate = (ids: string[]) => {
  userSelectedMenuIds.value = ids
}

onMounted(async () => {
  const roles = await communityStore.getCurrentUserRoles()
  if (roles == null || !roles.includes('manager')) {
    showAlertDialog($t('manage.event.not_manager'), () => {
      router.push(getCommunityPath(props.communityAccount))
    })
  }
})

onUnmounted(() => {
  if (props.eventId != null) {
    const eventStore = createAppEventStore(props.eventId)
    eventStore.$reset()
  } else if (hasFirestoreDraft.value && _event.value?.event_id != null) {
    const eventStore = createAppEventStore(_event.value.event_id)
    eventStore.$reset()
  }
})

/** 店舗一覧取得完了後のみ検証。未完了時は保存・申請を止める */
const assertCurrentShopDeliverable = (forReserve: boolean): boolean => {
  const e = event.value
  if (e == null || e.shop_id === '') {
    return true
  }
  if (partnerShopListStore.totalCount == null) {
    const msg = $t('event_edit.shop_list_loading')
    if (forReserve) {
      showAlertDialog(msg)
    } else {
      showNotification(msg, 'warning')
    }
    return false
  }
  const loc = location.value
  const pos = loc != null ? { longitude: loc.longitude, latitude: loc.latitude } : null
  if (!isPartnerShopIdDeliverableAt(e.shop_id, pos, e.event_start_datetime, partnerShopListStore.shops ?? [])) {
    const msg = $t('event_edit.shop_not_deliverable_before_save')
    if (forReserve) {
      showAlertDialog(msg)
    } else {
      showNotification(msg, 'error')
    }
    return false
  }
  return true
}

const createEventDraft = async (): Promise<BokudeliEvent | null> => {
  const communityId = communityStore.community?.community_id
  if (event.value == null || communityId == null) {
    return null
  }
  if (!assertCurrentShopDeliverable(false)) {
    return null
  }
  const shop = selectedShop.value
  if (shop != null && event.value.shop_id !== '') {
    updateEventDeadlineFromShop(event.value, shop)
  }
  const handleUserId = currentUserStore.firebaseUser?.uid ?? ''
  event.value.community_id = communityId
  event.value.created_by = handleUserId
  event.value.updated_by = handleUserId
  if (!persistMinimumParticipantsOnSave()) {
    return null
  }
  const newEvent = await createNewEvent(toRaw(event.value), coverImage.value, {
    draftPreparer: eventDraftPreparerFromEnterpriseId(communityStore.community?.enterprise_id),
  })
  if (newEvent.event_id !== '') {
    try {
      await updateEventMenus(newEvent.event_id, communityId, selectedMenuIds.value)
    } catch (error) {
      console.error('Failed to update event menus:', error)
      throw error
    }
  }
  hasFirestoreDraft.value = true
  return newEvent
}

const persistMinimumParticipantsOnSave = (): boolean => {
  if (event.value == null) {
    return false
  }
  try {
    applyMinimumParticipantsForEventSave(event.value)
    return true
  } catch (error) {
    if (error instanceof MinimumParticipantsSaveError) {
      showAlertDialog(error.message)
      return false
    }
    throw error
  }
}

const updateEventDraft = async (): Promise<BokudeliEvent | null> => {
  const communityId = communityStore.community?.community_id
  if (event.value == null || communityId == null) {
    return null
  }
  const status = event.value.event_status?.value
  // 参加受付中中など下書き以外では配達可否で保存を阻害しない。店舗が設定変更可能性を考慮
  if (status == null || status === 'in_draft') {
    if (!assertCurrentShopDeliverable(false)) {
      return null
    }
  }
  const shop = selectedShop.value
  if (shop != null && event.value.shop_id !== '') {
    updateEventDeadlineFromShop(event.value, shop)
  }
  const handleUserId = currentUserStore.firebaseUser?.uid ?? ''
  event.value.updated_by = handleUserId

  // 既存編集は props.eventId、新規ウィザードの仮保存済みは event.value.event_id を store キーにする
  const persistId = props.eventId ?? (hasFirestoreDraft.value ? event.value.event_id : null)
  if (persistId == null || persistId === '') {
    return null
  }

  if (!persistMinimumParticipantsOnSave()) {
    return null
  }

  const eventStore = createAppEventStore(persistId)
  await eventStore.updateEvent(event.value)
  if (coverImage.value != null) {
    await eventStore.updateCoverImage(coverImage.value)
  }
  if (event.value.calculatedEventStatus !== 'finished') {
    try {
      await updateEventMenus(event.value.event_id, communityId, selectedMenuIds.value)
    } catch (error) {
      console.error('Failed to update event menus:', error)
      throw error
    }
  }
  return event.value
}

const submitReservation = async () => {
  const communityId = communityStore.community?.community_id
  if (event.value == null || communityId == null) {
    showAlertDialog($t('manage.event.save_failed'))
    return
  }
  const handleUserId = currentUserStore.firebaseUser?.uid ?? ''
  if (handleUserId === '') {
    showAlertDialog($t('manage.event.save_failed'))
    return
  }
  if (isReserveDataMissing.value) {
    showAlertDialog($t('event_edit.shop_list_loading'))
    return
  }

  processingState.value = 'reserving'
  try {
    const ev = await updateEventDraft()
    if (ev?.event_id == null || ev.community_id === '' || ev.community_account === '') {
      console.warn('The event does not have enough information.', ev)
      showAlertDialog($t('manage.event.save_failed'))
      return
    }
    const result = validateCurrentReservationRequest(ev)
    if (result == null) {
      showAlertDialog($t('event_edit.shop_list_loading'))
      return
    }
    if (!result.ok) {
      showReserveValidationFailure(result.reasonCodes)
      return
    }
    ev.event_status = { value: 'applying_reservation', shop_comment: '' }
    const eventStore = createAppEventStore(ev.event_id)
    await eventStore.updateEvent(ev)
    showNotification($t('manage.event.reserve_success', { name: ev.shop_name }), 'success')
    emits('updated', ev.event_id)
  } catch (error) {
    console.error('Failed to send reserve mail:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    showAlertDialog($t('manage.event.reserve_error', { error: errorMessage }))
  } finally {
    processingState.value = null
  }
}

const handleStep3Primary = async () => {
  if (props.eventId != null) {
    stepper.value++
    return
  }
  if (hasFirestoreDraft.value) {
    stepper.value++
    return
  }
  processingState.value = 'creating'
  try {
    const ev = await createEventDraft()
    if (ev == null) {
      showNotification($t('event_edit.draft_save_failed'), 'error')
      return
    }
    showNotification($t('event_edit.draft_saved'), 'success')
    stepper.value++
  } catch (error) {
    console.error('Failed to create event draft:', error)
    showNotification($t('event_edit.draft_save_failed'), 'error')
  } finally {
    processingState.value = null
  }
}

const handleSecondarySave = async () => {
  processingState.value = 'saving'
  try {
    const ev = await updateEventDraft()
    if (ev == null) {
      showNotification($t('event_edit.draft_save_failed'), 'error')
      return
    }
    showNotification($t('event_edit.saved'), 'success')
  } catch (error) {
    console.error('Failed to save draft:', error)
    showNotification($t('event_edit.draft_save_failed'), 'error')
  } finally {
    processingState.value = null
  }
}

const secondarySaveDisabledForStep = (step: number): boolean => {
  if (isProcessing.value) {
    return true
  }
  if (isLoadingMenu.value) {
    return true
  }
  const e = event.value
  if (e == null) {
    return true
  }
  // 下書き保存の Zod が店舗を必須とするため、未選択の間は仮保存を押せないようにする
  if (e.shop_id === '') {
    return true
  }
  switch (step) {
    case 1:
      return !isValid1.value
    case 2:
      return false
    case 3:
      return selectedMenuCount.value === 0
    case 4:
      return !isValid4.value
    default:
      return true
  }
}

const submit = async () => {
  processingState.value = 'submitting'
  try {
    const ev = props.eventId != null || hasFirestoreDraft.value ? await updateEventDraft() : await createEventDraft()
    if (ev == null) {
      showNotification($t('manage.event.save_failed'), 'error')
      return
    }
    showNotification($t('manage.event.updated_success', { name: ev.event_name }), 'success')
    emits('updated', ev.event_id)
  } catch (error) {
    console.error('Failed to save event:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    showAlertDialog($t('manage.event.save_error', { error: errorMessage }))
  } finally {
    processingState.value = null
  }
}

const openReserveConfirm = () => {
  shopNoticeRef.value?.openReserveConfirmDialog()
}

const resolveHasEventCoverImage = (): boolean => {
  if (coverImage.value != null) {
    return true
  }
  const communityCover = communityStore.coverImageUrl
  if (communityCover != null && communityCover !== '') {
    return true
  }
  const eventId = props.eventId ?? (hasFirestoreDraft.value && event.value != null ? event.value.event_id : null)
  if (eventId == null) {
    return false
  }
  const eventStore = createAppEventStore(eventId)
  const eventCover = eventStore.coverImageUrl
  return eventCover != null && eventCover !== ''
}

const handleStep1Next = async () => {
  if (isProcessing.value) {
    return
  }
  const ev = event.value
  if (ev == null) {
    return
  }

  try {
    const formResult = await step1FormRef.value?.validate?.()

    const messages = collectEventBasicInfoValidationMessages({
      event: ev,
      requiredValidator,
      postalCodeValidator,
      urlValidator,
      t: $t,
    })
    if (messages.length > 0) {
      step1ValidationDialog.messages = messages
      step1ValidationDialog.visible = true
      return
    }
    if (formResult?.valid !== true) {
      step1ValidationDialog.messages = [$t('event_edit.form_fields_invalid')]
      step1ValidationDialog.visible = true
      return
    }
    stepper.value++
  } catch (error) {
    console.error('Failed to validate step 1:', error)
    showAlertDialog($t('manage.event.save_failed'))
  }
}

const handleStep4Next = async () => {
  if (isProcessing.value) {
    return
  }
  const ev = event.value
  if (ev == null) {
    return
  }

  try {
    const formResult = await step4FormRef.value?.validate?.()

    const messages = collectEventDetailValidationMessages({
      event: ev,
      hasCoverImage: resolveHasEventCoverImage(),
      isEnterpriseMode: paymentUiStrategy.value.isEnterpriseMode,
      requiredValidator,
      requiredHtmlValidator,
      positiveIntegerValidator,
      emailValidator,
      t: $t,
    })
    if (messages.length > 0) {
      step4ValidationDialog.messages = messages
      step4ValidationDialog.visible = true
      return
    }
    if (formResult?.valid !== true) {
      step4ValidationDialog.messages = [$t('event_edit.form_fields_invalid')]
      step4ValidationDialog.visible = true
      return
    }
    stepper.value++
  } catch (error) {
    console.error('Failed to validate step 4:', error)
    showAlertDialog($t('manage.event.save_failed'))
  }
}

const handleReserveButtonClick = async () => {
  if (isReserveButtonDisabled.value) {
    return
  }
  const ev = event.value
  if (ev == null) {
    return
  }
  const handleUserId = currentUserStore.firebaseUser?.uid ?? ''
  if (handleUserId === '') {
    showAlertDialog($t('manage.event.save_failed'))
    return
  }
  if (isReserveDataMissing.value) {
    showAlertDialog($t('event_edit.shop_list_loading'))
    return
  }

  try {
    const formResult = await shopNoticeRef.value?.validateForm?.()

    const result = validateCurrentReservationRequest(ev)
    if (result == null) {
      showAlertDialog($t('event_edit.shop_list_loading'))
      return
    }
    if (!result.ok) {
      showReserveValidationFailure(result.reasonCodes)
      return
    }
    if (formResult?.valid !== true) {
      reserveValidationDialog.messages = [$t('event_edit.form_fields_invalid')]
      reserveValidationDialog.visible = true
      return
    }
    openReserveConfirm()
  } catch (error) {
    console.error('Failed to validate reservation request:', error)
    showAlertDialog($t('manage.event.save_failed'))
  }
}

const stepperItems = computed(() => [
  {
    title: '場所・日時',
  },
  {
    title: '店舗選択',
  },
  {
    title: 'メニュー',
  },
  {
    title: 'イベント詳細',
  },
  {
    title: '店舗への連絡事項',
  },
])
</script>

<template>
  <div v-if="event" class="event-edit-page">
    <v-stepper v-model="stepper" :items="stepperItems" hide-actions>
      <template #[`item.1`]>
        <v-form ref="step1FormRef" v-model="isValid1">
          <v-row class="justify-center">
            <v-col cols="12" sm="12" md="9">
              <event-basic-info-card v-model="event" :min-start-date="minEventStartDate" />
              <event-edit-step-nav :visible="stepper === 1">
                <v-btn
                  color="primary"
                  size="x-large"
                  rounded="xl"
                  min-width="168"
                  :append-icon="mdiChevronRight"
                  :disabled="isProcessing"
                  @click="handleStep1Next"
                >
                  {{ $t('event_edit.next') }}
                </v-btn>
                <template v-if="canUseSecondarySave" #secondary>
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="x-large"
                    rounded="xl"
                    min-width="168"
                    :disabled="secondarySaveDisabledForStep(1)"
                    @click="handleSecondarySave"
                  >
                    {{ $t('event_edit.save_draft') }}
                  </v-btn>
                </template>
              </event-edit-step-nav>
            </v-col>
          </v-row>
        </v-form>
      </template>
      <template #[`item.2`]>
        <event-shop v-model="event" :shops="shops ?? []" :loading="shops == null" @submit="stepper++" />
        <event-edit-step-nav :visible="stepper === 2">
          <v-btn
            color="primary"
            size="x-large"
            rounded="xl"
            min-width="168"
            :prepend-icon="mdiChevronLeft"
            :disabled="isProcessing"
            @click="stepper--"
          >
            {{ $t('event_edit.back') }}
          </v-btn>
          <v-btn
            v-if="event.shop_id !== ''"
            color="primary"
            size="x-large"
            rounded="xl"
            min-width="168"
            :append-icon="mdiChevronRight"
            :disabled="isProcessing || selectedShop == null"
            @click="handleStep2Next"
          >
            {{ $t('event_edit.next') }}
          </v-btn>
          <template v-if="canUseSecondarySave" #secondary>
            <v-btn
              color="primary"
              variant="tonal"
              size="x-large"
              rounded="xl"
              min-width="168"
              :disabled="secondarySaveDisabledForStep(2)"
              @click="handleSecondarySave"
            >
              {{ $t('event_edit.save_draft') }}
            </v-btn>
          </template>
        </event-edit-step-nav>
      </template>
      <template #[`item.3`]>
        <event-menu
          :menus="eventMenus"
          :event="event"
          :shop="selectedShop"
          :loading="isLoadingMenu"
          :disabled="isFinished"
          @update:selectedMenuIds="handleMenuIdsUpdate"
        />
        <event-edit-step-nav :visible="stepper === 3">
          <v-btn
            color="primary"
            size="x-large"
            rounded="xl"
            min-width="168"
            :prepend-icon="mdiChevronLeft"
            :disabled="isProcessing"
            @click="stepper--"
          >
            {{ $t('event_edit.back') }}
          </v-btn>
          <v-btn
            color="primary"
            size="x-large"
            rounded="xl"
            min-width="168"
            :append-icon="mdiChevronRight"
            :disabled="(props.eventId == null && selectedMenuCount === 0) || isProcessing || isLoadingMenu"
            :loading="processingState === 'creating'"
            @click="handleStep3Primary"
          >
            {{ props.eventId != null || hasFirestoreDraft ? $t('event_edit.next') : $t('event_edit.save_and_proceed') }}
          </v-btn>
          <template v-if="canUseSecondarySave" #secondary>
            <v-btn
              color="primary"
              variant="tonal"
              size="x-large"
              rounded="xl"
              min-width="168"
              :disabled="secondarySaveDisabledForStep(3)"
              @click="handleSecondarySave"
            >
              {{ $t('event_edit.save_draft') }}
            </v-btn>
          </template>
        </event-edit-step-nav>
      </template>
      <template #[`item.4`]>
        <v-form ref="step4FormRef" v-model="isValid4">
          <v-row class="justify-center">
            <v-col cols="12" sm="12" md="9">
              <event-detail-card
                v-model="event"
                v-model:cover-image="coverImage"
                :subdomain-tags="communityStore.community?.subdomain_tags"
                :album-manage-url="albumManageUrl"
                :is-new="props.eventId == null && !hasFirestoreDraft"
                :payment-ui-strategy="paymentUiStrategy"
              />
              <event-edit-step-nav :visible="stepper === 4">
                <v-btn
                  color="primary"
                  size="x-large"
                  rounded="xl"
                  min-width="168"
                  :prepend-icon="mdiChevronLeft"
                  :disabled="isProcessing"
                  @click="stepper--"
                >
                  {{ $t('event_edit.back') }}
                </v-btn>
                <v-btn
                  color="primary"
                  size="x-large"
                  rounded="xl"
                  min-width="168"
                  :append-icon="mdiChevronRight"
                  :disabled="isProcessing"
                  @click="handleStep4Next"
                >
                  {{ $t('event_edit.next') }}
                </v-btn>
                <template v-if="canUseSecondarySave" #secondary>
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="x-large"
                    rounded="xl"
                    min-width="168"
                    :disabled="secondarySaveDisabledForStep(4)"
                    @click="handleSecondarySave"
                  >
                    {{ $t('event_edit.save_draft') }}
                  </v-btn>
                </template>
              </event-edit-step-nav>
            </v-col>
          </v-row>
        </v-form>
      </template>
      <template #[`item.5`]>
        <event-shop-notice
          ref="shopNoticeRef"
          v-model="event"
          v-model:shop="selectedShop"
          @send-reserve-mail="submitReservation"
        />
        <event-edit-step-nav :visible="stepper === 5">
          <div class="event-edit-step-nav__step5-top-row">
            <v-btn
              color="primary"
              size="x-large"
              rounded="xl"
              min-width="168"
              :prepend-icon="mdiChevronLeft"
              :disabled="isProcessing"
              @click="stepper--"
            >
              {{ $t('event_edit.back') }}
            </v-btn>
            <v-btn
              color="primary"
              size="x-large"
              rounded="xl"
              min-width="168"
              :append-icon="mdiChevronRight"
              :disabled="isProcessing || isLoadingMenu || event.shop_id === ''"
              :loading="processingState === 'submitting'"
              @click="submit"
            >
              {{ $t('event_edit.save_and_preview') }}
            </v-btn>
          </div>
          <template v-if="props.eventId != null || hasFirestoreDraft" #secondary>
            <div class="event-edit-step-nav__step5-reserve-row">
              <v-btn
                class="event-shop-notice-footer__reserve"
                :disabled="isReserveButtonDisabled"
                :loading="processingState === 'reserving'"
                color="grey-900"
                size="x-large"
                rounded="xl"
                :prepend-icon="mdiEmailOutline"
                @click="handleReserveButtonClick"
              >
                {{ $t('shop_notice.send_reserve_mail') }}
              </v-btn>
            </div>
          </template>
        </event-edit-step-nav>
      </template>
    </v-stepper>
  </div>
  <confirm-dialog v-model="isContactDialogOpen" :ok-text="'OK'" max-width="800px">
    <div class="text-center py-6 text-h4">
      {{ $t('event_create_modal.title') }}
    </div>
    <div class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('event_create_modal.desc')" />
    </div>
  </confirm-dialog>

  <confirm-dialog v-model="alertDialog.visible" :ok-click="handleAlertDialogOk" ok-text="OK">
    {{ alertDialog.message }}
  </confirm-dialog>

  <confirm-dialog
    v-model="step4ValidationDialog.visible"
    :title="$t('event_edit.validation_modal_title')"
    role="alertdialog"
    :ok-text="$t('ok')"
    ok-variant="text"
  >
    <v-alert type="error" variant="tonal" density="compact" :icon="false" class="mb-0">
      <ul class="event-edit-reserve-validation-list mb-0">
        <li v-for="(message, idx) in step4ValidationDialog.messages" :key="idx">{{ message }}</li>
      </ul>
    </v-alert>
  </confirm-dialog>

  <confirm-dialog
    v-model="step1ValidationDialog.visible"
    :title="$t('event_edit.validation_modal_title')"
    role="alertdialog"
    :ok-text="$t('ok')"
    ok-variant="text"
  >
    <v-alert type="error" variant="tonal" density="compact" :icon="false" class="mb-0">
      <ul class="event-edit-reserve-validation-list mb-0">
        <li v-for="(message, idx) in step1ValidationDialog.messages" :key="idx">{{ message }}</li>
      </ul>
    </v-alert>
  </confirm-dialog>

  <confirm-dialog
    v-model="reserveValidationDialog.visible"
    :title="$t('manage.event.reserve_validation_modal_title')"
    role="alertdialog"
    :ok-text="$t('ok')"
    ok-variant="text"
  >
    <p class="mb-3">{{ $t('manage.event.reserve_validation_intro') }}</p>
    <v-alert type="error" variant="tonal" density="compact" :icon="false" class="mb-0">
      <ul class="event-edit-reserve-validation-list mb-0">
        <li v-for="(message, idx) in reserveValidationDialog.messages" :key="idx">{{ message }}</li>
      </ul>
    </v-alert>
  </confirm-dialog>
</template>

<style lang="scss" scoped>
.event-edit-page {
  /* 最終ステップの2段フッター（戻る・保存 + 予約申請）用に余白を確保 */
  padding-bottom: calc(9rem + env(safe-area-inset-bottom, 0px));
}

.event-edit-step-nav__step5-top-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px 12px;
  width: 100%;
}

.event-edit-step-nav__step5-reserve-row {
  display: flex;
  justify-content: center;
  width: 100%;
}

.event-edit-reserve-validation-list {
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;

  li + li {
    margin-top: 0.25rem;
  }
}

.event-shop-notice-footer__reserve {
  min-width: 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.02em;

  :deep(.v-btn__content) {
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
  }
}

@media (max-width: 600px) {
  :deep(.v-stepper-window) {
    margin: 0;
  }
}
</style>
