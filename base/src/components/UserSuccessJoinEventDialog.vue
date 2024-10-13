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
import { mdiContentCopy, mdiChat, mdiCloseCircle, mdiMagnify } from '@mdi/js'

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
    <v-card class="px-sm-15 py-sm-9 pa-2 pre-line">
      <v-card-title class="text-center text-h3 py-5">注文完了🎉</v-card-title>
      <v-card-text class="text-center text-h6 px-0 pt-3 pb-1">
        参加申し込みが完了しました！<br />
      </v-card-text>
      <v-card-text class="text-center text-h6 px-0 pt-1 pb-3">
        SNSにシェアして食事でつながっていこう👍<br />
      </v-card-text>
      <div class="mx-4">
        <v-img class="mx-0" cover aspect-ratio="1.91" :src="state.event.event_cover_url" />
        <v-card-text class="text-left pb-1 px-0">🌟
          <a :href="state.event.url" target="_blank">
          {{ state.event.event_name }}
          </a>
        </v-card-text>
        <v-card-text class="text-left pb-1 px-0">
          📅 {{ dateWithDayOfWeekString(state.event.event_start_datetime) }}〜{{
            dateOnlyTimeString(state.event.event_end_datetime)
          }}
        </v-card-text>
        <v-card-text class="text-left pb-1 px-0">
          ⏳ {{ dateWithDayOfWeekString(state.event.event_deadline_datetime) }} に注文締切
        </v-card-text>
        <v-card-text class="text-left pb-1 px-0">📍 {{ state.event.event_address }} </v-card-text>
        <v-card-text class="text-left pb-1 px-0">👥 {{ state.event.community_name }}</v-card-text>
        <v-card-text class="text-left pb-1 px-0">🍱 {{ state.event.shop_name }}</v-card-text>
          <v-row>
          <v-card-text class="text-center mt-3">
            <v-btn class="ma-2" size="x-large" color="grey-900" :append-icon="mdiChat" rounded="pill" @click="shareSnsButton('twitter', state.event)">
              Xに投稿して友だちを誘う
            </v-btn>
          </v-card-text>
        </v-row>
        <v-card-text class="text-center px-0 py-1">
          <v-btn :prepend-icon="mdiMagnify" class="mx-1 text-lowercase" size="small" color="grey-600" rounded="pill" variant="text" href="https://x.com/search?q=%23shokujii&src=typed_query&f=live" target="_blank">
            #shokujiiを見る
          </v-btn>
          <v-btn :prepend-icon="mdiContentCopy" class="mx-1" size="small" color="grey-600" rounded="pill" variant="text"  @click="shareSnsButton('copy', state.event)">
            テキストコピー
          </v-btn>
          <v-btn :prepend-icon="mdiCloseCircle" class="mx-1" size="small" color="grey-600" rounded="pill" variant="text" @click="closeDialog">
            閉じる
          </v-btn>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.text-lowercase {
  text-transform: lowercase;
}
</style>
