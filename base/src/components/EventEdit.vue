<script setup lang="ts">
import { ref, shallowRef, reactive, computed, watch, onMounted, onUnmounted, toRaw } from 'vue'
import { isInShopTime } from '@shokujii/common/utils/datetime.js'
import EventBasicInfoCard from '@shokujii/base/components/eventcreate/EventBasicInfoCard.vue'
import EventShop from '@shokujii/base/components/eventcreate/EventShop.vue'
import EventMenu from '@shokujii/base/components/eventcreate/EventMenu.vue'
import EventDetailCard from '@shokujii/base/components/eventcreate/EventDetailCard.vue'
import EventShopNotice from '@shokujii/base/components/eventcreate/EventShopNotice.vue'
import EventEditStepNav from '@shokujii/base/components/eventcreate/EventEditStepNav.vue'
import { BokudeliEvent, createNewEvent, updateEventMenus } from '@shokujii/base/stores/event.js'
import { usePartnerStore, type BokudeliPartnerMenu, type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { useEventStore, type EventStore, BokudeliEventMenu } from '@shokujii/base/stores/event'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community'
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
import { calculateDistance, fetchLocationByPostalcode, LatLogLocation } from '@shokujii/base/utils/fetchLocation'
import { updateEventDeadlineFromShop } from '@shokujii/common/utils/eventShopDeadline.js'
import { isAddressBaseValidForPostalcode } from '@shokujii/base/utils/isAddressBaseValidForPostalcode'
import { maxBy } from 'lodash'
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

const { requiredValidator, postalCodeValidator } = useValidators()

const alertDialog = reactive({
  visible: false,
  message: '',
  onClose: undefined as (() => void) | undefined,
})

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

const shopNoticeFormValid = ref(false)
const shopNoticeRef = shallowRef<{ openReserveConfirmDialog: () => void } | null>(null)

const communityStore = useCommunityStore(props.communityAccount) as CommunityStore

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
      const eventStore = useEventStore(props.eventId) as EventStore
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
      const eventStore = useEventStore(props.eventId) as EventStore
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
  return partnerShopListStore.shops
    ?.map((shop) => {
      // calculate distance
      let distance = 0
      if (shop.shop_address_longitude != null && shop.shop_address_latitude != null) {
        const shopLocation = {
          longitude: shop.shop_address_longitude,
          latitude: shop.shop_address_latitude,
        }
        distance = calculateDistance(selectedLocation, shopLocation)
      }
      // 最小注文個数の配列の何番目かを取得
      const rangeIndex = shop.shop_range_min_orders.findIndex(
        (order) => order?.range != null && order.range >= distance,
      )
      // 最小注文個数（注文の目安）を取得。値がない場合は30に設定
      const min_orders_on_spot = shop.shop_range_min_orders[rangeIndex]?.min_orders ?? 30
      return Object.assign(Object.create(Object.getPrototypeOf(shop)), shop, {
        distance,
        min_orders_on_spot,
      })
    })
    .filter((shop: BokudeliPartnerShopWithExtras) => {
      // check distance
      const distance = shop.distance
      const maxRange = maxBy(shop.shop_range_min_orders, 'range')?.range
      const isInRange = maxRange ? distance <= maxRange : false

      // check time
      const eventTimeStart = event.value?.event_start_datetime
      if (eventTimeStart == null) {
        return false
      }
      const isInTime = isInShopTime(eventTimeStart, shop)
      return isInRange && isInTime && shop.is_approved && shop.is_open
    })
    .sort((a, b) => a.min_orders_on_spot - b.min_orders_on_spot)
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
  const ev = event.value
  const shop = resolvedShopFromMaster.value
  if (ev != null && shop != null) {
    updateEventDeadlineFromShop(ev, shop)
  }
  stepper.value++
}

const currentUserStore = useCurrentUserStore()

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
  if (partnerId === '') {
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
  const eventStore = useEventStore(id) as EventStore
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
    e.shop_id = ''
    e.partner_id = ''
    e.shop_name = ''
    _userSelectedMenuIds.value = null
    showNotification($t('event_edit.shop_cleared_incompatible_datetime'), 'warning')
  },
)

// 終了したイベントは編集不可
const isFinished = computed(() => event.value?.calculatedEventStatus === 'finished')

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
    const eventStore = useEventStore(props.eventId) as EventStore
    eventStore.$reset()
  } else if (hasFirestoreDraft.value && _event.value?.event_id != null) {
    const eventStore = useEventStore(_event.value.event_id) as EventStore
    eventStore.$reset()
  }
})

const createEventDraft = async (): Promise<BokudeliEvent | null> => {
  const communityId = communityStore.community?.community_id
  if (event.value == null || communityId == null) {
    return null
  }
  const shop = resolvedShopFromMaster.value
  if (shop != null && event.value.shop_id !== '') {
    updateEventDeadlineFromShop(event.value, shop)
  }
  const handleUserId = currentUserStore.firebaseUser?.uid ?? ''
  event.value.community_id = communityId
  event.value.created_by = handleUserId
  event.value.updated_by = handleUserId
  const newEvent = await createNewEvent(toRaw(event.value), coverImage.value)
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

const updateEventDraft = async (): Promise<BokudeliEvent | null> => {
  const communityId = communityStore.community?.community_id
  if (event.value == null || communityId == null) {
    return null
  }
  const shop = resolvedShopFromMaster.value
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

  const eventStore = useEventStore(persistId) as EventStore
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

  processingState.value = 'reserving'
  try {
    const ev = await updateEventDraft()
    if (ev?.event_id == null || ev.community_id === '' || ev.community_account === '') {
      console.warn('The event does not have enough information.', ev)
      showAlertDialog($t('manage.event.save_failed'))
      return
    }
    const reservationCheck = ev.isValidForReservation(handleUserId)
    if (!reservationCheck.ok) {
      showAlertDialog($t('manage.event.reserve_validation_failed', { fields: reservationCheck.missing.join('、') }))
      return
    }
    ev.event_status = { value: 'applying_reservation', shop_comment: '' }
    const eventStore = useEventStore(ev.event_id) as EventStore
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
        <v-form v-model="isValid1">
          <v-row class="justify-center">
            <v-col cols="12" sm="12" md="9">
              <event-basic-info-card v-model="event" />
              <event-edit-step-nav :visible="stepper === 1">
                <v-btn
                  color="primary"
                  size="x-large"
                  rounded="xl"
                  min-width="168"
                  :append-icon="mdiChevronRight"
                  :disabled="!isValid1 || isProcessing"
                  @click="stepper++"
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
            :disabled="isProcessing"
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
        <v-form v-model="isValid4">
          <v-row class="justify-center">
            <v-col cols="12" sm="12" md="9">
              <event-detail-card
                v-model="event"
                v-model:cover-image="coverImage"
                :subdomain-tags="communityStore.community?.subdomain_tags"
                :album-manage-url="albumManageUrl"
                :is-new="props.eventId == null && !hasFirestoreDraft"
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
                  :disabled="!isValid4 || isProcessing"
                  @click="stepper++"
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
          v-model:form-valid="shopNoticeFormValid"
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
                :disabled="
                  !shopNoticeFormValid || event.event_status?.value !== 'in_draft' || isProcessing || isLoadingMenu
                "
                :loading="processingState === 'reserving'"
                color="grey-900"
                size="x-large"
                rounded="xl"
                :prepend-icon="mdiEmailOutline"
                @click="openReserveConfirm"
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
