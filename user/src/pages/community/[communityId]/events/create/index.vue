<script setup lang="ts">
import EventBasicInfo from '@/components/eventcreate/EventBasicInfo.vue'
import EventShop from '@/components/eventcreate/EventShop.vue'
import EventMenu from '@/components/eventcreate/EventMenu.vue'
import EventDetail from '@/components/eventcreate/EventDetail.vue'
import EventShopNotice from '@/components/eventcreate/EventShopNotice.vue'
import { collection, doc, collectionGroup, getDocs, query, where, addDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import {
  convertDocumentDataToEvent,
  convertDocumentDataToCommunity,
  convertDocumentDataToMenu,
  convertDateToWeekTimestamp,
  convertShopTimeToWeekTimestamp,
} from '@/schemes/converter'
import { createEmptyEvent } from '@/schemes/bokudeliEvent'
import Shop from '@/schemes/shop'
import PartnerMenu from '@/schemes/partnerMenu'
import { useRouter, useRoute } from 'vue-router'
import { getEventPath, getCommunityPath } from '@/router/utils'
import { uploadEventImage } from '@/composable/uploadImage'
import { calculateDistance, fetchLocationByPostalcode } from '@/composable/fetchLocation'
import { maxBy } from 'lodash'
import { checkCommunityManager } from '@/composable/checkCommunityManager'
import { postalCodeValidator } from '@/utils/validators'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  communityId: string
}>()

const eventId = route.query.id as string | null

const event = ref(createEmptyEvent())
const shops = ref<Shop[]>([])
const menus = ref<PartnerMenu[]>([])
const coverImage = ref<File | null>(null)

const stepper = ref(1)
const stepQuery = route.query.step as number | null
// クエリに値があればステッパーを移動
if (stepQuery) {
  stepper.value = stepQuery
}

const isLoadingShop = ref(false)
const isLoadingMenu = ref(false)

const fetchData = async () => {
  const communityDb = query(collection(db, 'communities'), where('community_account', '==', props.communityId))
  const promises = [getDocs(communityDb)]
  if (eventId != null) {
    const eventDb = query(collectionGroup(db, 'events'), where('event_id', '==', eventId))
    promises.push(getDocs(eventDb))
  }
  const [communitySnapshot, eventData] = await Promise.all(promises)
    .then((results) => [results[0]?.docs?.shift(), results[1]?.docs?.shift()?.data()])
  if (eventData != null) {
    event.value = convertDocumentDataToEvent(eventData)
    await fetchShops()
    await fetchMenu()
  }
  if (communitySnapshot != null) {
    const { communityId, communityName, communityAccount } = convertDocumentDataToCommunity(communitySnapshot.data())
    event.value.community_id = communityId
    event.value.community_name = communityName
    event.value.community_account = communityAccount
    const isCommunityManager = await checkCommunityManager(communitySnapshot.ref)
    if (!isCommunityManager) {
      window.alert('コミュニティ管理者ではありません')
      router.push(getCommunityPath(communityAccount))
    }
  }
}

const fetchShops = async () => {
  const startDateTime =  event.value.event_start_datetime?.toDate()
  const postalcode = event.value.event_postalcode
  if (postalcode == null || postalCodeValidator(postalcode) !== true) {
    return
  }
  const location = await fetchLocationByPostalcode(postalcode)
  if (location == null || startDateTime == null) {
    shops.value = []
    return 
  }

  isLoadingShop.value = true

  const shopDb = collectionGroup(db, 'shops')
  const shopSnapshot = await getDocs(shopDb)
  shops.value = shopSnapshot.docs
    .map((doc) => {
      return doc.data() as Shop
    })
    .filter((shop) => {
      // check distance
      const shopLocation = {
        longitude: shop.shop_address_longitude,
        latitude: shop.shop_address_latitude,
      }
      const distance = calculateDistance(location, shopLocation)
      const maxRange = maxBy(shop.shop_range_min_orders, 'range')?.range
      const isInRange = maxRange ? distance <= maxRange : false

      // check time
      const eventTimeStart = convertDateToWeekTimestamp(startDateTime)
      const isInTime = shop.shop_time.some((shopTime, dayOfWeek) => {
        if (!shopTime.is_open) {
          return false
        }
        const timeStart = convertShopTimeToWeekTimestamp(dayOfWeek, shopTime.time_start)
        const timeEnd = convertShopTimeToWeekTimestamp(dayOfWeek, shopTime.time_end)
        const timeStart2 = convertShopTimeToWeekTimestamp(dayOfWeek, shopTime.time_start2)
        const timeEnd2 = convertShopTimeToWeekTimestamp(dayOfWeek, shopTime.time_end2)
        return (
          (timeStart <= eventTimeStart && eventTimeStart <= timeEnd) ||
          (timeStart2 <= eventTimeStart && eventTimeStart <= timeEnd2)
        )
      })

      return isInRange && isInTime && shop.is_approved && shop.is_open
    })
  isLoadingShop.value = false
}

const fetchMenu = async () => {
  const { partner_id } = event.value
  if (!partner_id) {
    return
  }

  isLoadingMenu.value = true
  const partnerDb = collection(db, 'partners')

  const menuSnapshot = await getDocs(collection(partnerDb, partner_id, 'menus'))

  menus.value = menuSnapshot.docs
    .map((doc) => convertDocumentDataToMenu(partner_id, doc.id, doc.data()))
    .sort((a, b) => (b.updatedAt?.valueOf() ?? 0) - (a.updatedAt?.valueOf() ?? 0))

  isLoadingMenu.value = false
}

onBeforeRouteUpdate(async (to, from, next) => {
  if (to.params.communityId !== from.params.communityId) {
    await fetchData()
  }
  next()
})

const isOpenContactDialogVisible = ref(false)

onMounted(async () => {
  isOpenContactDialogVisible.value = true
  await fetchData()
})

const saveDraft = async () => {
  if (!event.value.community_id) {
    return null
  }
  if (eventId == null) {
    // 新規作成
    const eventItem = {
      ...event.value,
      ...{
        event_status: { value: 'in_draft'},
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      },
    }

    const addedDoc = await addDoc(collection(db, 'communities', eventItem.community_id, 'events'), eventItem)
    const eventCoverUrl = coverImage.value
      ? await uploadEventImage(eventItem.community_id, addedDoc.id, coverImage.value)
      : ''
    await setDoc(addedDoc, { event_id: addedDoc.id, event_cover_url: eventCoverUrl }, { merge: true })
    return addedDoc.id
  } else {
    // 更新
    const eventItem = {
      ...event.value,
      ...{
        updated_at: Timestamp.now(),
      },
    }
    if (coverImage.value) {
      eventItem.event_cover_url = (await uploadEventImage(event.value.community_id, eventId, coverImage.value)) ?? ''
    }
    await updateDoc(doc(db, 'communities', event.value.community_id, 'events', eventId), eventItem)
    return eventId
  }
}

const sumbmit = async () => {
  const newEventId = await saveDraft()
  if (newEventId == null || !event.value.community_account) {
    return
  }
  if (eventId == null) {
    window.alert(`イベントID： ${newEventId} のイベントを新規作成しました`)
  } else {
    window.alert(`イベントID： ${eventId} のイベントを更新しました`)
  }
  router.push(getEventPath(event.value.community_account, newEventId))
}

const sendReserveMail = async () => {
  const newEventId = await saveDraft()
  if (newEventId == null || !event.value.community_id || !event.value.community_account) {
    return
  }
  await updateDoc(doc(db, 'communities', event.value.community_id, 'events', newEventId), {
    event_status: { value: 'applying_reservation' },
  })
  router.push(getEventPath(event.value.community_account, newEventId))
}

const stepperItems = computed(() => [
  {
    title: '基本情報',
  },
  {
    title: 'お店',
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
  <v-stepper v-model="stepper" :items="stepperItems" hide-actions>
    <template #[`item.1`]>
      <event-basic-info v-model="event" @submit="fetchShops(); stepper++" />
    </template>
    <template #[`item.2`]>
      <event-shop v-model="event" :shops="shops" :loading="isLoadingShop" @submit="fetchMenu(); stepper++" @next="stepper++" @back="stepper--" />
    </template>
    <template #[`item.3`]>
      <event-menu :menus="menus" :loading="isLoadingMenu" @submit="stepper++" @back="stepper--" />
    </template>
    <template #[`item.4`]>
      <event-detail v-model="event" v-model:cover-image="coverImage" @submit="stepper++" @back="stepper--" />
    </template>
    <template #[`item.5`]>
      <event-shop-notice v-model="event" @submit="sumbmit" @send-reserve-mail="sendReserveMail" @back="stepper--" />
    </template>
    <div>
      <confirm-dialog v-model="isOpenContactDialogVisible" :ok-text="'OK'" max-width="800px">
        <v-card-text class="text-center py-10 text-h6">
          イベントの作成・編集について
        </v-card-text>        
        <v-card-text class="text-subtitle pb-0" style="line-height: 1.5rem">
          ・「開催場所」「開催日時」を入力後、対応可能な店舗を選択してイベント内容や注文情報を入力してください。<br>
          ・下書き保存をし、プレビューの確認後、店舗に予約申請をしてください。<br>
          ・店舗から予約申請の承認を受けたら、注文を開始することができます。<br>
          ・店舗から予約申請が却下された場合、店舗や日時などを変更して再度予約申請をしてください。<br>
          <br>
          ・予約申請後、「店舗」「開催場所」「開催日時」などの変更はできません。<br>
          ・予約申請後、「イベントタイトル」「イベント詳細」「イベント画像」の編集は可能です。<br>
          <br>
          ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティマニュアル</a> をご確認ください。<br>
          ・ご不明点ありましたらサポートまで <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。<br>
        </v-card-text>
      </confirm-dialog>
    </div>
  </v-stepper>
</template>

<style lang="scss" scoped></style>
