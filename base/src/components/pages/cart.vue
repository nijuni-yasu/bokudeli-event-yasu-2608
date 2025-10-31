<script setup lang="ts">
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { loadEventMembers } from '@shokujii/base/composable/loadEventMembers'
import { db, functions } from '@shokujii/base/firebase'
import { getCommunityPath, getEventPath, getUserPath, getProfile } from '@/router/utils'
import { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { dateWithDayOfWeekString, dateOnlyTimeString, priceString } from '@shokujii/base/schemes/converter'
import { EventOrder, type OrderMenuType } from '@shokujii/common/schemas/EventOrder.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event'
import { collectionGroup, getDocs, orderBy, query, where } from 'firebase/firestore'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import CancelPolicyDialog from '@shokujii/base/components/CancelPolicyDialog.vue'
import { mdiTrashCan, mdiHelpCircleOutline } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { getAdditionalUserInfo, getAuth, TwitterAuthProvider } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { linkByProviderService } from '@shokujii/base/utils/providerService'
import { FirebaseError } from 'firebase/app'
import { createStripeCheckoutSession } from '@shokujii/base/apis/stripe'

const { t: $t } = useI18n()
const router = useRouter()
const {
  user: currentUser,
  personalInformation: currentUserPersonalInformation,
  firebaseUser,
} = storeToRefs(useCurrentUserStore())
const userId = computed(() => currentUser.value?.id ?? '')
const twitterAccountConnected = computed(
  () => firebaseUser.value?.providerData.some((info) => info.providerId === 'twitter.com') ?? false,
)

type Cart = {
  order: EventOrder
  subtotals: { [key: string]: number }
  total: number
  event: BokudeliEvent
  twitterPostEnabled: boolean
  twitterPostComment: string
}

const state = reactive({
  cartList: [] as Cart[],
  isLoading: true,
})

const checkCart = async (cart: Cart): Promise<true | 'deadline' | 'limitPeople'> => {
  const { event } = cart

  if (event.event_deadline_datetime && event.event_deadline_datetime < Date.now()) {
    return 'deadline'
  }

  const memebers = await loadEventMembers(event.community_account, event.event_id)
  if (memebers.length >= event.event_max_people) {
    return 'limitPeople'
  }
  return true
}

const isOpenAlert = ref(false)
const alertMessage = ref('')

const alertBody = computed({
  get() {
    return alertMessage.value
  },
  set(val) {
    alertMessage.value = val
    isOpenAlert.value = true
  },
})

const showDisableAlert = (reason: 'deadline' | 'limitPeople') => {
  switch (reason) {
    case 'deadline':
      alertBody.value = $t('cart.cannot_order_deadline')
      break
    case 'limitPeople':
      alertBody.value = $t('cart.cannot_order_limit_people')
      break
  }
}

const openConfirmOrder = ref(false)
const confirmDialogMessage = ref('')
const selectedOrder = ref({} as EventOrder)
const selectedCartEvent = ref({} as BokudeliEvent)
const selectedCartTwitterPostEnabled = ref<boolean>(false)
const selectedCartTwitterPostComment = ref<string>('')
const selectedMenu = ref({} as OrderMenuType)
const isOrderProcessing = ref<boolean>(false)

const startOrderProcess = async () => {
  isOrderProcessing.value = true
  const order = selectedOrder.value
  const event = selectedCartEvent.value
  const twitterPostEnabled = selectedCartTwitterPostEnabled.value
  let isPosted = false

  if (twitterPostEnabled) {
    const postToTwitter = httpsCallable(functions, 'postToTwitter')
    await postToTwitter({ user_id: userId.value, post_comment: selectedCartTwitterPostComment.value })
      .then(() => {
        isPosted = true
      })
      .catch(() => {
        isPosted = false
      })
  }

  if (event.event_payment == 'user_advance') {
    try {
      const response = (await createStripeCheckoutSession({ order, isPosted })) as any // 一時的措置
      isOrderProcessing.value = false
      window.location.href = response.data.url || getEventPath(order.community_account, order.event_id)
    } catch {
      alertBody.value = $t('cart.payment_failed')
    }
  } else {
    try {
      const eventStore = useEventStore(event.event_id) as EventStore
      await eventStore.updateOrderStatus(order, 'ordered')
      isOrderProcessing.value = false
      router.push(
        `${getUserPath(userId.value)}?eventId=${order.event_id}&communityAccount=${order.community_account}&isPosted=${isPosted}`,
      )
    } catch {
      alertBody.value = $t('cart.order_failed')
    }
  }
}

const paymentMessage = (event: BokudeliEvent) => {
  switch (event.event_payment) {
    case 'user_advance': {
      return $t('cart.confirm_order_credit_card')
    }
    case 'user_on_day': {
      return $t('cart.confirm_order_participant_on_day')
    }
    case 'community_bill': {
      return $t('cart.confirm_order_community_bill')
    }
    default: {
      return $t('cart.confirm_order')
    }
  }
}

const openUserParameterConfirm = ref(false)
const targetUserParameter = ref('')
const showConfirm = async (cart: Cart) => {
  // ユーザー名存在チェック
  if (!currentUser.value?.user_name) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_name')
    openUserParameterConfirm.value = true
    return
  }

  // アイコン存在チェック
  if (!currentUser.value?.user_image_url) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_image')
    openUserParameterConfirm.value = true
    return
  }

  // メールアドレス存在チェック
  if (!currentUserPersonalInformation.value?.user_email) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_email')
    openUserParameterConfirm.value = true
    return
  }

  const checkResult = await checkCart(cart)
  if (checkResult !== true) {
    showDisableAlert(checkResult)
    return
  }

  selectedOrder.value = cart.order
  selectedCartEvent.value = cart.event
  selectedCartTwitterPostEnabled.value = cart.twitterPostEnabled
  selectedCartTwitterPostComment.value = cart.twitterPostComment
  confirmDialogMessage.value = paymentMessage(cart.event)
  openConfirmOrder.value = true
}

const openDeleteConfirm = ref(false)
const startDeleteProcess = async () => {
  const event = selectedCartEvent.value
  const eventStore = useEventStore(event.event_id) as EventStore
  await eventStore.deleteOrder(selectedOrder.value, selectedMenu.value.menu_id)
  alertBody.value = $t('cart.removed_from_cart')
  state.cartList = await loadCartList()
}

const deleteMenuInCart = async (event: BokudeliEvent, order: EventOrder, menu: OrderMenuType) => {
  selectedCartEvent.value = event
  selectedOrder.value = order
  selectedMenu.value = menu
  openDeleteConfirm.value = true
}

const generateDefaultXPostComment = (event: BokudeliEvent) => {
  const eventUrl = `${window.location.origin}${getEventPath(event.community_account, event.event_id)}`
  const hashtag = event.event_sns_hash_tag ? `#${event.event_sns_hash_tag} ` : ''
  return $t('cart.x_post.default_comment', {
    eventName: event.event_name,
    eventUrl: eventUrl,
    hashtag: hashtag,
  })
}

const loadCartList = async () => {
  // カート情報の取得
  const inCartQuery = query(
    collectionGroup(db, 'orders'),
    where('user_id', '==', userId.value),
    where('status', '==', 'in_cart'),
    orderBy('updated_at', 'desc'),
  )

  const cartSnapshot = await getDocs(inCartQuery)
  const orderItems = cartSnapshot.docs.flatMap((doc) => {
    const eventId = doc.ref.parent.parent!.id
    const data = doc.data()
    // TODO 直接 new するのではなく store を経由する
    try {
      return new EventOrder(eventId, doc.id, data)
    } catch (err) {
      console.error(err)
      return []
    }
  })

  // イベント情報を引きオーダー情報とくっつける
  const convertedList = await Promise.all(
    orderItems.map(async (item) => {
      const eventQuery = query(
        collectionGroup(db, 'events'),
        where('community_account', '==', item.community_account),
        where('event_id', '==', item.event_id),
      )
      const eventSnapshot = await getDocs(eventQuery)
      if (eventSnapshot.docs.length === 0) {
        console.error($t('cart.event_not_found'), { item })
        return []
      }
      const event = new BokudeliEvent(item.community_id, item.event_id, eventSnapshot.docs[0].data())
      if (event.event_status.value !== 'accepting_order') {
        return []
      }

      const subtotals = {} as { [key: string]: number }
      item.menus.forEach((menu) => {
        subtotals[menu.menu_id] = menu.price * menu.count
      })
      const total = Object.values(subtotals).reduce((total, current) => total + current)

      // デフォルトのX投稿設定を各カートに追加
      const defaultXPostComment = generateDefaultXPostComment(event)
      return [
        {
          order: item,
          event,
          subtotals,
          total,
          twitterPostEnabled: event.is_public ? twitterAccountConnected.value : false,
          twitterPostComment: defaultXPostComment,
        },
      ]
    }),
  )

  return convertedList.flat()
}

const isOpenCancelpolicyDialog = ref(false)

const notification = inject('notification') as Notification
const isTwitterLoading = ref<boolean>(false)
const isOpenTwitterLinkDialog = ref<boolean>(false)

const handleTwitterLoginLink = async () => {
  try {
    isTwitterLoading.value = true
    const userCredential = await linkByProviderService(firebaseUser.value!, 'Twitter')

    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    if (additionalUserInfo) {
      // await setSNSProfile(userCredential, additionalUserInfo)
    }

    // ユーザー情報を再取得して更新
    const auth = getAuth()
    if (auth.currentUser) {
      await auth.currentUser.reload()
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = TwitterAuthProvider.credentialFromError(error)
      console.error({ error, credential })
      if (error.code === 'auth/credential-already-in-use') {
        return Object.assign(notification, { message: $t('user.exists_credential', { snsName: 'X' }), color: 'error' })
      }
      if (error.code === 'auth/email-already-in-use') {
        return Object.assign(notification, { message: $t('complete.exists_email'), color: 'error' })
      }
    } else {
      console.error({ error })
    }
  } finally {
    isTwitterLoading.value = false
  }
}

onMounted(async () => {
  state.isLoading = true
  state.cartList = await loadCartList()
  state.isLoading = false
})
</script>

<template>
  <v-row v-if="!state.isLoading && state.cartList.length !== 0" justify="center">
    <v-col cols="12" md="8" sm="8" class="pa-0 mt-5">
      <div class="text-center text-h3 my-3">{{ $t('cart.title') }}</div>
      <div class="text-center my-3">{{ $t('cart.subtitle') }}</div>
    </v-col>
    <v-col v-for="cart in state.cartList" :key="cart.event.event_id" cols="12" md="8" sm="8">
      <v-card class="pa-0 pa-md-10 ma-0 ma-md-5">
        <v-row>
          <v-col class="d-flex align-center">
            <v-img class="ma-5" cover aspect-ratio="1.91" :src="cart.event.event_cover_url" />
          </v-col>
        </v-row>
        <v-card-text class="card-text-style">
          {{ $t('cart.community_name') }}
          <router-link :to="getCommunityPath(cart.event.community_account)">
            {{ cart.event.community_name }}
          </router-link>
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.event_name') }}
          <router-link :to="getEventPath(cart.event.community_account, cart.event.event_id)">
            {{ cart.event.event_name }}
          </router-link>
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.place') }} {{ cart.event.event_address }} {{ cart.event.event_place }}
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.date') }}{{ dateWithDayOfWeekString(cart.event.event_start_datetime) }}〜{{
            dateOnlyTimeString(cart.event.event_end_datetime)
          }}
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.deadline') }}{{ dateWithDayOfWeekString(cart.event.event_deadline_datetime) }}
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.payment') }}{{ $t(`payment.${cart.event.event_payment}`) }} <br />
        </v-card-text>
        <v-card-text class="d-flex align-center card-text-style">
          <div class="d-flex flex-column align-center">
            {{ $t('cart.cancel') }}
          </div>
          <div class="event-content d-flex flex-column align-center">
            {{ $t('cart.cancel_until_deadline') }}
          </div>
          <div class="d-flex flex-column align-center">
            <v-btn
              :icon="mdiHelpCircleOutline"
              color="primary"
              density="compact"
              variant="text"
              @click="isOpenCancelpolicyDialog = true"
            >
            </v-btn>
          </div>
        </v-card-text>
        <v-card-text class="card-text-style"> {{ $t('cart.shop') }}{{ cart.event.shop_name }} </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.order_contents') }}
        </v-card-text>
        <v-row class="text-center align-center text-md-body-1 text-caption">
          <v-col cols="12" class="px-8">
            <v-card class="pa-0" elevation="1">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-center" style="padding: 2px">{{ $t('cart.menu') }}</th>
                    <th class="text-center" style="padding: 1px">{{ $t('cart.count') }}</th>
                    <th class="text-center" style="padding: 1px">{{ $t('cart.subtotal') }}</th>
                    <th class="text-center" style="padding: 1px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="menu in cart.order.menus" :key="menu.menu_id">
                    <td style="padding: 1px">{{ menu.name }}</td>
                    <td style="padding: 1px">{{ menu.count }}</td>
                    <td style="padding: 1px">¥{{ priceString(menu.price) }}</td>
                    <td style="padding: 1px">
                      <v-btn :icon="mdiTrashCan" variant="text" @click="deleteMenuInCart(cart.event, cart.order, menu)">
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
        <v-card-text class="text-right">
          <span class="text-right ma-2 text-h6">{{ $t('cart.total') }}</span>
          <span class="text-right my-2 ml-2 text-h6">¥</span>
          <span class="text-right ma-2 text-h3 text-md-h2 font-weight-bold">{{ priceString(cart.total) }}</span>
        </v-card-text>
        <!-- X投稿設定 -->
        <v-row v-if="cart.event.is_public" class="mt-3">
          <v-col cols="12" class="px-8">
            <v-card class="x-post-section" elevation="1">
              <div v-if="twitterAccountConnected">
                <v-card-text class="card-text-style"> 【{{ $t('cart.x_post.title') }}】 </v-card-text>
                <v-card-text class="card-text-style">
                  <v-checkbox v-model="cart.twitterPostEnabled" class="px-2" color="primary" hide-details>
                    <template #label>
                      <span class="text-subtitle-1">
                        {{ $t('cart.x_post.enable_post') }}
                      </span>
                    </template>
                  </v-checkbox>
                </v-card-text>
                <v-textarea
                  v-if="cart.twitterPostEnabled"
                  v-model="cart.twitterPostComment"
                  class="px-5"
                  :placeholder="$t('cart.x_post.comment_placeholder')"
                  :label="$t('cart.x_post.comment_label')"
                  counter="140"
                  maxlength="140"
                  rows="3"
                  variant="outlined"
                  hide-details="auto"
                />
              </div>
              <div v-else>
                <v-card-text class="card-text-style"> 【{{ $t('cart.x_post.title') }}】 </v-card-text>
                <v-card-text class="card-text-style">
                  <v-btn
                    size="small"
                    rounded="pill"
                    class="ma-2"
                    variant="outlined"
                    @click="() => (isOpenTwitterLinkDialog = true)"
                  >
                    {{ $t('cart.x_post.connect_x') }}
                  </v-btn>
                </v-card-text>
                <v-textarea
                  v-model="cart.twitterPostComment"
                  class="px-5"
                  :placeholder="$t('cart.x_post.comment_placeholder')"
                  :label="$t('cart.x_post.comment_label')"
                  counter="140"
                  maxlength="140"
                  rows="3"
                  variant="outlined"
                  disabled
                />
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="justify-center">
          <v-col class="text-center">
            <v-btn
              class="my-8 text-md-h4 text-h5"
              color="grey-900"
              size="x-large"
              rounded="pill"
              elevation="5"
              width="85%"
              @click="showConfirm(cart)"
            >
              {{ $t('cart.order_and_attend_event') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
  <v-row justify="center" v-else-if="!state.isLoading">
    <v-col cols="auto" class="my-5" style="font-size: 18px"> {{ $t('cart.no_items_in_cart') }}</v-col>
  </v-row>
  <v-row v-else justify="center">
    <v-col cols="auto">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-col>
  </v-row>
  <CancelPolicyDialog v-model="isOpenCancelpolicyDialog" />

  <confirm-dialog
    v-model="openConfirmOrder"
    :is-confirm="true"
    :ok-click="startOrderProcess"
    :ok-loading-state="isOrderProcessing"
  >
    {{ confirmDialogMessage }}
  </confirm-dialog>
  <confirm-dialog v-model="openDeleteConfirm" :is-confirm="true" :ok-click="startDeleteProcess">
    {{ $t('cart.remove_from_cart') }}
  </confirm-dialog>
  <confirm-dialog v-model="isOpenAlert" :is-confirm="false">{{ alertMessage }}</confirm-dialog>
  <confirm-dialog
    v-model="openUserParameterConfirm"
    :is-confirm="true"
    :ok-click="() => router.push({ path: getProfile() })"
    :ok-text="$t('cart.go_to_setting')"
  >
    {{ targetUserParameter }}
  </confirm-dialog>

  <confirm-dialog
    v-model="isOpenTwitterLinkDialog"
    :is-confirm="true"
    :ok-text="$t('profile.linkage')"
    :ok-click="handleTwitterLoginLink"
    :ok-loading-state="isTwitterLoading"
  >
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('profile.twitter_link_modal_title') }}
    </v-card-text>
    <v-card-text class="text-center py-5">
      <div v-html="$t('profile.twitter_link_modal_description')"></div>
    </v-card-text>
  </confirm-dialog>
</template>
<style scoped>
.v-table {
  border: none !important;
}
.v-table th,
.v-table td {
  border: none !important;
}
.v-table thead th {
  border-bottom: none !important;
}
.v-table tbody tr {
  border-bottom: none !important;
}

.card-text-style {
  font-size: 14px !important;
  padding-bottom: 14px !important;
}

.x-post-section {
  background-color: #fafcfe;
  border-radius: 8px;
}

@media (max-width: 959px) {
  .card-text-style {
    font-size: 12px !important;
    padding-bottom: 12px !important;
  }
}
</style>
