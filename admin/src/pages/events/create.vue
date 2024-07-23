<script setup lang="ts">
import { getAuth } from 'firebase/auth'
import { usePartnerStore } from '@/stores/partner'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { useEventsStore, type EventsStore, useEventStore, type EventStore } from '@/stores/event'
import { getCommunityPath, getShopPath } from '@/navigation/utils'
import type { Shop } from '@/schemes/shop'
import EventDetailCard from '@/components/eventcreate/EventDetailCard.vue'
import EventBasicInfoCard from '@/components/eventcreate/EventBasicInfoCard.vue'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import { Timestamp } from 'firebase/firestore'
import type BokudeliCommunity from '@/schemes/bokudeliCommunity'

const notification = inject('notification') as Notification

const router = useRouter()
const route = useRoute()
const { t: $t } = useI18n()

const partnerId = getAuth().currentUser?.uid ?? ''
const partnerStore = usePartnerStore(partnerId)
const eventsStore = useEventsStore() as EventsStore

const shop = await new Promise<Shop | null>((resolve) => {
  watch(
    () => partnerStore.shops,
    (shops) => {
      if (shops != null) {
        if (shops.length === 0) {
          resolve(null)
        } else {
          resolve(shops[0])
        }
        stop()
      }
    },
    { immediate: true },
  )
})

if (shop == null) {
  window.alert($t('alert.make_shop'))
  router.push(getShopPath())
  throw new Error()
}
const communityAccount = shop.community_account
if (communityAccount == null) {
  window.alert($t('alert.make_community_account'))
  router.push(getCommunityPath())
  throw new Error()
}
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const community = await new Promise<BokudeliCommunity>((resolve) => {
  watch(
    () => communityStore.community,
    (community) => {
      if (community != null) {
        resolve(community)
        stop()
      }
    },
    { immediate: true },
  )
})

const communityId = community.community_id
const communityName = community.community_name

let _event: BokudeliEvent
if (route.query.id != null) {
  const eventStore = useEventStore(route.query.id as string) as EventStore
  _event = await new Promise<BokudeliEvent>((resolve) => {
    watch(
      () => eventStore.event,
      (event) => {
        if (event != null) {
          resolve(event)
          stop()
        }
      },
      { immediate: true },
    )
  })
} else {
  _event = eventsStore.eventDraft
  _event.community_account = communityAccount
  _event.community_id = communityId
  _event.community_name = communityName
  _event.event_postalcode = shop.shop_postcode
  _event.event_address = shop.shop_address
  _event.event_place = shop.shop_name
  _event.event_place_url = shop.shop_url
  _event.partner_id = partnerId
  _event.shop_id = shop.shop_id!
  _event.shop_name = shop.shop_name
  _event.event_status = { value: 'accepting_order' }
}

const event = ref<BokudeliEvent>(_event)

const isLoading = ref(false)
const isValid = ref(false)
const coverImage = ref<File | null>(null)

// TODO utils に移動
const calcOrderDeadline = (eventStartTimestamp: Timestamp, deadLine: { days_before: number; time: number }) => {
  const startDateTime = eventStartTimestamp.toDate()
  startDateTime.setDate(startDateTime.getDate() - deadLine.days_before)
  // UTC なので必ず Date Object にしてから使う
  const deadLineTime = new Date(deadLine.time)
  startDateTime.setHours(deadLineTime.getHours())
  startDateTime.setMinutes(deadLineTime.getMinutes())
  return Timestamp.fromDate(startDateTime)
}

watch(
  () => event.value.event_start_datetime,
  (startTimestamp) => {
    if (startTimestamp == null) {
      event.value.event_deadline_datetime = null
      return
    }
    event.value.event_deadline_datetime = calcOrderDeadline(startTimestamp, shop.shop_deadline_datetime)
  },
)

const submit = async () => {
  isLoading.value = true
  try {
    if (route.query.id != null) {
      const eventStore = useEventStore(route.query.id as string) as EventStore
      await eventStore.updateEvent(toRaw(event.value))
      if (coverImage.value != null) {
        await eventStore.updateCoverImage(coverImage.value)
      }
      Object.assign(notification, { message: $t('event.updated'), color: 'success' })
    } else {
      const newEvent = await eventsStore.createNewEventFromDraft(communityId)
      const eventStore = useEventStore(newEvent.event_id) as EventStore
      if (coverImage.value != null) {
        await eventStore.updateCoverImage(coverImage.value)
      }
      Object.assign(notification, { message: $t('event.created'), color: 'success' })
    }
    router.push('/events')
  } catch (err) {
    console.error(err)
    Object.assign(notification, { message: $t('event.error'), color: 'error' })
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  eventsStore.$reset()
})
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-form v-model="isValid">
        <EventBasicInfoCard v-model="event" />
        <EventDetailCard v-model="event" v-model:cover-image="coverImage" :subdomainTags="community.subdomain_tags" />
        <v-card-text class="text-center mt-10">
          <v-btn color="primary" size="large" :disabled="!isValid" :loading="isLoading" @click="submit">
            {{ event.event_id == '' ? $t('event.create') : $t('event.update') }}
          </v-btn>
        </v-card-text>
      </v-form>
    </v-col>
  </v-row>
</template>
