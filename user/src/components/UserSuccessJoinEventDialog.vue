<script setup lang="ts">
import { db } from '@/firebase'
import {
  type DocumentData,
  QueryDocumentSnapshot,
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import {
  dateWithDayOfWeekString,
  dateOnlyTimeString,
  convertDocumentDataToCommunity,
  convertDocumentDataToEvent,
} from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { type PartnerMenu } from '@/schemes/partnerMenu'
import { type EventMember } from '@/schemes/EventMember'
import { shareSnsButton } from '@/composable/shareSnsButton'

interface Props {
  modelValue: boolean
  eventId: string | null
  communityAccount: string | null
}

interface Emit {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const closeDialog = () => {
  dialog.value = false
}

const eventDb = query(
  collectionGroup(db, 'events'),
  where('community_account', '==', props.communityAccount),
  where('event_id', '==', props.eventId),
)
const communityDb = query(collection(db, 'communities'), where('community_account', '==', props.communityAccount))

const state = reactive({
  event: {} as BokudeliEvent,
  community: {} as BokudeliCommunity,
  menus: [] as PartnerMenu[],
  eventSnapshot: undefined as QueryDocumentSnapshot<DocumentData> | undefined,
  members: [] as EventMember[],
  menuDisable: false as false | 'deadline' | 'limitPeople',
  isLoading: true,
})

const loadEventData = async (eventDocumentSnapshot: QueryDocumentSnapshot<DocumentData> | undefined) => {
  if (!eventDocumentSnapshot) {
    return undefined
  }

  const eventData = eventDocumentSnapshot.data()
  const event = convertDocumentDataToEvent(eventData)
  return { event }
}

onMounted(async () => {
  const [eventSnapshot, communitySnapshot] = await Promise.all([getDocs(eventDb), getDocs(communityDb)])

  const communityData = communitySnapshot.docs.shift()?.data()
  if (communityData) {
    const community = convertDocumentDataToCommunity(communityData)
    state.community = community
  }

  const eventDocumentSnapshot = eventSnapshot.docs.shift()

  const [eventInfo] = await Promise.all([loadEventData(eventDocumentSnapshot)])
  if (eventInfo) {
    state.eventSnapshot = eventDocumentSnapshot
    state.event = eventInfo.event
  }

  state.isLoading = false
})
</script>

<template>
  <v-dialog v-model="dialog" :width="$vuetify.display.smAndDown ? 'auto' : 650" persistent>
    <v-card class="pa-sm-9 pa-5 pre-line">
      <v-card-title class="text-center text-h5 pb-5">🍱 注文完了 🍱</v-card-title>
      <v-card-text class="text-center px-0 pt-3 pb-6">
        参加申し込みが完了しました。<br>
        SNSに参加する食事会をシェアして食事でつながろう👍<br>
      </v-card-text>
      <v-card-text class="text-center text-h5 px-0 py-2">
        <span class="ma-1 font-weight-bold">
          <a href="https://twitter.com/hashtag/%E9%A3%9F%E4%BA%8B%E3%81%A7%E3%81%A4%E3%81%AA%E3%81%8C%E3%82%8B?src=hashtag_click" target="_blank">#食事でつながる</a>
        </span>
        <span class="ma-1 font-weight-bold">
          <a href="https://twitter.com/search?q=%23shokujii&src=typed_query" target="_blank">#shokujii</a>
        </span>
      </v-card-text>
      <v-card-text class="text-center px-0 mb-5">
        <v-btn
          class="ml-1"
          icon="mdi-alpha-x-circle"
          color="grey-900"
          size="x-large"
          density="compact"
          variant="text"
          @click="shareSnsButton('twitter', state.event)"
        ></v-btn>
        <v-btn
          class="ml-1"
          icon="mdi-facebook"
          color="#1877F2"
          size="x-large"
          density="compact"
          variant="text"
          @click="shareSnsButton('facebook', state.event)"
        ></v-btn>
        <v-btn
          class="ml-1"
          icon="mdi-alpha-l-circle"
          color="#06c755"
          size="x-large"
          density="compact"
          variant="text"
          @click="shareSnsButton('line', state.event)"
        ></v-btn>
        <v-btn
          class="mx-1"
          icon="mdi-link-variant"
          color="grey-900"
          size="x-large"
          density="compact"
          variant="text"
          @click="shareSnsButton('copy', state.event)"
        ></v-btn>
      </v-card-text>
      <div class="mx-4">
        <v-img class="mx-0" cover aspect-ratio="1.91" :src="state.event.event_cover_url" />
        <v-card-text class="text-left text-subtitle-2 pb-1 px-0">{{ state.event.event_name }}</v-card-text>
        <v-card-text class="text-left text-subtitle-2 pb-1 px-0">🙋‍♀️ {{ state.event.community_name }}</v-card-text>
        <v-card-text class="text-left text-subtitle-2 pb-1 px-0">🗓 {{ dateWithDayOfWeekString(state.event.event_start_datetime) }}〜{{ dateOnlyTimeString(state.event.event_end_datetime) }}</v-card-text>
        <v-card-text class="text-left text-subtitle-2 pb-1 px-0">📍 {{ state.event.event_address }} {{ state.event.event_place }}</v-card-text>
        <v-card-text class="text-left text-subtitle-2 pb-1 px-0">👩‍🍳 {{ state.event.shop_name }}</v-card-text>
        <v-card-text class="text-left text-subtitle-2 pb-1 px-0">🎟 {{ state.event.url }}</v-card-text>
        <v-card-text class="text-left text-subtitle-2 pb-1 px-0">#食事でつながる #shokujii</v-card-text>
        <v-card-text class="text-center">
          <v-btn class="mt-5" size="x-small" color="grey-600" rounded variant="outlined" @click="closeDialog">閉じる</v-btn>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>
