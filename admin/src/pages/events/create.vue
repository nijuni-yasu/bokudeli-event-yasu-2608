<script setup lang="ts">
import { getAuth } from 'firebase/auth'
import { usePartnerStore, type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'
import { getCommunityPath, getShopPath, getEventPath, getUserEventUrl } from '@/navigation/utils'
import { useEventStore, type EventStore, type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useEventListStore } from '@shokujii/base/stores/eventList.js'
import EventDetailCard from '@shokujii/base/components/eventcreate/EventDetailCard.vue'
import EventBasicInfoCard from '@shokujii/base/components/eventcreate/EventBasicInfoCard.vue'
import { type BokudeliCommunity } from '@shokujii/base/stores/community.js'
import { mdiOpenInNew } from '@mdi/js'
import { useNotification } from '@shokujii/base/composable/notification.js'

const notification = useNotification()

const router = useRouter()
const route = useRoute()
const { t: $t } = useI18n()

const partnerId = getAuth().currentUser?.uid ?? ''
const partnerStore = usePartnerStore(partnerId)
const eventListStore = useEventListStore()

const shop = await new Promise<BokudeliPartnerShop | null>((resolve) => {
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
  if (eventStore.event?.community_account !== communityAccount) {
    window.alert($t('alert.invalid_account'))
    router.push(getEventPath())
    throw new Error()
  }
} else {
  _event = eventListStore.eventDraft
  _event.community_account = communityAccount
  _event.community_id = communityId
  _event.community_name = communityName
  _event.event_postalcode = shop.shop_postcode ?? ''
  _event.event_address = shop.shop_address ?? ''
  _event.event_place = shop.shop_name ?? ''
  _event.event_place_url = shop.shop_url ?? ''
  _event.partner_id = partnerId
  _event.shop_id = shop.shop_id
  _event.shop_name = shop.shop_name ?? ''
  _event.event_status = { value: 'in_draft' }
}

const event = ref<BokudeliEvent>(_event)

const isLoading = ref(false)
const isValid = ref(false)
const coverImage = ref<File | null>(null)

// TODO utils に移動
const calcOrderDeadline = (eventStartTime: number, deadLine: { days_before: number; time: number }) => {
  const startDateTime = new Date(eventStartTime)
  startDateTime.setDate(startDateTime.getDate() - deadLine.days_before)
  // UTC なので必ず Date Object にしてから使う
  const deadLineTime = new Date(deadLine.time)
  startDateTime.setHours(deadLineTime.getHours())
  startDateTime.setMinutes(deadLineTime.getMinutes())
  return startDateTime.getTime()
}

watch(
  () => event.value.event_start_datetime,
  (startTime) => {
    if (startTime == null) {
      event.value.event_deadline_datetime = Date.now()
      return
    }
    event.value.event_deadline_datetime = calcOrderDeadline(startTime, shop.shop_deadline_datetime)
  },
)

const submit = async (apply: boolean) => {
  isLoading.value = true
  if (apply) {
    event.value.event_status = { value: 'applying_to_admin' }
  }
  try {
    if (route.query.id != null) {
      const eventStore = useEventStore(route.query.id as string) as EventStore
      await eventStore.updateEvent(toRaw(event.value))
      if (coverImage.value != null) {
        await eventStore.updateCoverImage(coverImage.value)
      }
      notification.show($t('event.updated'), 'success')
    } else {
      const newEvent = await eventListStore.createNewEventFromDraft(communityId)
      const eventStore = useEventStore(newEvent.event_id) as EventStore
      if (coverImage.value != null) {
        await eventStore.updateCoverImage(coverImage.value)
      }
      notification.show($t('event.created'), 'success')
    }
    router.push('/events')
  } catch (err) {
    console.error(err)
    notification.show($t('event.error'), 'error')
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  eventListStore.reload()
})
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <div>
        <a :href="getUserEventUrl(event.community_account, event.event_id)" target="_blank">
          {{ $t('event.user_event_page') }} <v-icon :icon="mdiOpenInNew" />
        </a>
      </div>
      <v-form v-model="isValid">
        <EventBasicInfoCard v-model="event" class="my-10" :readonly="event.event_status.value !== 'in_draft'" />
        <EventDetailCard
          v-model="event"
          v-model:coverImage="coverImage"
          :readonlyDeadline="event.event_status.value !== 'in_draft'"
          :subdomainTags="community.subdomain_tags"
        />
        <v-card-text class="text-end mt-10">
          <v-btn
            color="primary"
            size="large"
            variant="tonal"
            :disabled="!isValid"
            :loading="isLoading"
            @click="submit(false)"
          >
            {{ event.event_id == '' ? $t('event.save_draft') : $t('event.update') }}
          </v-btn>
          <v-btn
            v-if="event.event_status.value === 'in_draft'"
            class="ml-4"
            color="primary"
            size="large"
            :disabled="!isValid"
            :loading="isLoading"
            @click="submit(true)"
          >
            {{ $t('event.apply') }}
          </v-btn>
        </v-card-text>
      </v-form>
    </v-col>
  </v-row>
</template>
