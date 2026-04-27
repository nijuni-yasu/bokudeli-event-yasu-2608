<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, toRaw } from 'vue'
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
import { isAddressBaseValidForPostalcode } from '@shokujii/base/utils/isAddressBaseValidForPostalcode'
import { maxBy } from 'lodash'
import { useValidators } from '@shokujii/base/composable/validators'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'

import { useI18n } from 'vue-i18n'
const { t: $t } = useI18n()

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
const isSubmitting = ref(false)
const isReserveMailing = ref(false)

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

type BokudeliPartnerShopWithExtras = BokudeliPartnerShop & {
  distance: number
  min_orders_on_spot: number
}
const shops = computed<BokudeliPartnerShopWithExtras[] | undefined>(() => {
  const selectedLocation = location.value
  if (selectedLocation == null) {
    return undefined
  }
  const shopListStore = useShopListStore([])
  return shopListStore.shops
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

const isUpdatedStartTime = ref(false)

// partner_id に基づいて PartnerMenu を取得（null = 未取得）
const partnerMenus = computed<BokudeliPartnerMenu[] | null>(() => {
  const partnerId = event.value?.partner_id
  if (!partnerId) {
    return []
  }
  const partnerStore = usePartnerStore(partnerId)
  return partnerStore.menus ?? null
})

// 既存EventMenusを取得（null = 未取得）
const existingMenus = computed<BokudeliEventMenu[] | null>(() => {
  if (!props.eventId) return []
  const eventStore = useEventStore(props.eventId) as EventStore
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
      if (!props.eventId) {
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

// 開始日時が更新されたかどうかを監視
watch(
  () => event.value?.event_start_datetime,
  (newStartDateTime, oldStartDateTime) => {
    if (!newStartDateTime || !oldStartDateTime) {
      return
    }
    if (newStartDateTime !== oldStartDateTime) {
      isUpdatedStartTime.value = true
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
  }
})

const saveDraft = async (): Promise<BokudeliEvent | null> => {
  const communityId = communityStore.community?.community_id
  if (event.value == null || communityId == null) {
    return null
  }
  const handleUserId = currentUserStore.firebaseUser?.uid ?? ''

  if (props.eventId == null) {
    // 新規作成
    event.value.community_id = communityId
    event.value.created_by = handleUserId
    event.value.updated_by = handleUserId
    const newEvent = await createNewEvent(toRaw(event.value), coverImage.value)

    // メニューを作成（Callable Function経由）
    if (newEvent?.event_id) {
      try {
        await updateEventMenus(newEvent.event_id, communityId, selectedMenuIds.value)
      } catch (error) {
        console.error('Failed to update event menus:', error)
        throw error
      }
    }

    return newEvent
  } else {
    // 更新
    event.value.updated_by = handleUserId
    const eventStore = useEventStore(props.eventId) as EventStore
    await eventStore.updateEvent(event.value)
    if (coverImage.value != null) {
      await eventStore.updateCoverImage(coverImage.value)
    }

    // メニューを更新（Callable Function経由）
    // イベントが終了している場合はメニュー更新しない
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
}

const submit = async () => {
  const isNewEvent = props.eventId == null // 保存前に新規作成かどうかを判定
  isSubmitting.value = true
  try {
    const event = await saveDraft()
    if (event == null) {
      showAlertDialog($t('manage.event.save_failed'))
      return
    }
    if (isNewEvent) {
      showAlertDialog($t('manage.event.created_success', { name: event.event_name }), () =>
        emits('updated', event.event_id),
      )
    } else {
      showAlertDialog($t('manage.event.updated_success', { name: event.event_name }), () =>
        emits('updated', event.event_id),
      )
    }
  } catch (error) {
    console.error('Failed to save event:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    showAlertDialog($t('manage.event.save_error', { error: errorMessage }))
  } finally {
    isSubmitting.value = false
  }
}

const sendReserveMail = async () => {
  isReserveMailing.value = true
  try {
    const event = await saveDraft()
    if (event?.event_id == null || event?.community_id == null || event?.community_account == null) {
      // eslint-disable-next-line quotes
      console.warn("The event doesn't have enough information.", event)
      showAlertDialog($t('manage.event.save_failed'))
      return
    }
    event.event_status = { value: 'applying_reservation', shop_comment: '' }
    const eventStore = useEventStore(event.event_id) as EventStore
    await eventStore.updateEvent(event)
    showAlertDialog($t('manage.event.reserve_success', { name: event.shop_name }), () =>
      emits('updated', event.event_id),
    )
  } catch (error) {
    console.error('Failed to send reserve mail:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    showAlertDialog($t('manage.event.reserve_error', { error: errorMessage }))
  } finally {
    isReserveMailing.value = false
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
                  :disabled="!isValid1"
                  @click="stepper++"
                >
                  {{ $t('event_edit.next') }}
                </v-btn>
              </event-edit-step-nav>
            </v-col>
          </v-row>
        </v-form>
      </template>
      <template #[`item.2`]>
        <event-shop
          v-model="event"
          :shops="shops ?? []"
          :loading="shops == null"
          :is-updated-start-time="isUpdatedStartTime"
          :step-nav-visible="stepper === 2"
          @submit="stepper++"
          @next="stepper++"
          @back="stepper--"
        />
      </template>
      <template #[`item.3`]>
        <event-menu
          :menus="eventMenus"
          :event="event"
          :shop="selectedShop"
          :loading="isLoadingMenu"
          :disabled="isFinished"
          :step-nav-visible="stepper === 3"
          @update:selectedMenuIds="handleMenuIdsUpdate"
          @submit="stepper++"
          @back="stepper--"
        />
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
              />
              <event-edit-step-nav :visible="stepper === 4">
                <v-btn
                  color="primary"
                  size="x-large"
                  rounded="xl"
                  min-width="168"
                  :prepend-icon="mdiChevronLeft"
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
                  :disabled="!isValid4"
                  @click="stepper++"
                >
                  {{ $t('event_edit.next') }}
                </v-btn>
              </event-edit-step-nav>
            </v-col>
          </v-row>
        </v-form>
      </template>
      <template #[`item.5`]>
        <event-shop-notice
          v-model="event"
          v-model:shop="selectedShop"
          :loading-submit="isSubmitting"
          :loading-reserve="isReserveMailing"
          :loading-menu="isLoadingMenu"
          :step-nav-visible="stepper === 5"
          @submit="submit"
          @send-reserve-mail="sendReserveMail"
          @back="stepper--"
        />
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

@media (max-width: 600px) {
  :deep(.v-stepper-window) {
    margin: 0;
  }
}
</style>
