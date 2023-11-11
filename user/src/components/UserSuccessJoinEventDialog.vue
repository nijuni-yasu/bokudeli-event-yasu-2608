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
      <v-card-text>
        <p>下記のイベントに参加いたします。</p>
      </v-card-text>
      <v-card-title class="justify-center text-sm-h5 text-xs-h6 font-weight-semibold pb-5 pre-line">
        {{ state.event.event_name }}
      </v-card-title>
      <v-img class="ma-0" cover aspect-ratio="1.91" :src="state.event.event_cover_url" />
      <v-card-text class="text-left pb-5">【開催場所】{{ state.event.event_address }}</v-card-text>
      <v-card-text class="text-left pb-5"
        >【開催日時】{{ dateWithDayOfWeekString(state.event.event_start_datetime) }}〜{{ dateOnlyTimeString(state.event.event_end_datetime) }}</v-card-text
      >
      <v-card-text class="text-left pb-5">【開催内容】{{ state.event.event_desc }}</v-card-text>
      <v-btn type="submit" rounded @click="closeDialog">確認しました</v-btn>
    </v-card>
  </v-dialog>
</template>
