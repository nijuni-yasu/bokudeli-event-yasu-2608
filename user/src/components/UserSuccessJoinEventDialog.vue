<script setup lang="ts">
import { db } from '@/firebase'
import {
  DocumentData,
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
import PartnerMenu from '@/schemes/partnerMenu'
import { EventMember } from '@/schemes/EventMember'
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
      <v-card-item class="text-center">
        <v-card-title class="text-h4 font-weight-semibold">🍱 注文完了 🍱</v-card-title>
      </v-card-item>
      <v-card-text class="text-center px-0 mt-5">
        イベントへの参加申し込みが完了しました。<br>SNSにシェアして食事の輪を広げましょう！
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
      <v-img class="ma-0" cover aspect-ratio="1.91" :src="state.event.event_cover_url" />
      <v-card-text class="text-left pb-3">【イベント】{{ state.event.event_name }}</v-card-text>
      <v-card-text class="text-left pb-3">【主 催 者】{{ state.event.community_name }}</v-card-text>
      <v-card-text class="text-left pb-3">【開催日時】{{ dateWithDayOfWeekString(state.event.event_start_datetime) }}〜{{ dateOnlyTimeString(state.event.event_end_datetime) }}</v-card-text>
      <v-card-text class="text-left pb-3">【開催場所】{{ state.event.event_address }} {{ state.event.event_place }}</v-card-text>
      <v-card-text class="text-left pb-3">【開催内容】{{ state.event.event_desc }}</v-card-text>
      <v-card-text class="text-center">
        <v-btn color="grey-600" rounded variant="outlined" @click="closeDialog">閉じる</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
