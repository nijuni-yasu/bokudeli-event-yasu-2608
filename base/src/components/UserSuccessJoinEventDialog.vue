<script setup lang="ts">
import { mdiContentCopy, mdiCloseCircle, mdiSend } from '@mdi/js'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import { useEventStore } from '@/stores/event'
import type BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { useCommunityStore } from '@/stores/community'
import type { Shop } from '@/schemes/shop'
import { usePartnerStore } from '@/stores/partner'
import { shareSnsButton } from '@/utils/shareSnsButton'

const props = defineProps<{
  eventId: string
  communityAccount: string
}>()

const model = defineModel<boolean>()

const eventStore = useEventStore(props.eventId)
const communityStore = useCommunityStore(props.communityAccount)

const event = computed(() => eventStore.event)

const onShareSnsButtonClicked = async (type: 'twitterAfterOrder' | 'copy', event: BokudeliEvent) => {
  const _window = type !== 'copy' ? window.open('', '_blank', 'width=800,height=500')! : undefined
  const partnerStore = usePartnerStore(event.partner_id)
  const [community, shop] = await Promise.all([
    new Promise<BokudeliCommunity>((resolve) => {
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
    }),
    new Promise<Shop | undefined>((resolve) => {
      watch(
        () => partnerStore.shops,
        (shops) => {
          if (shops != null) {
            resolve(shops[0])
            stop()
          }
        },
        { immediate: true },
      )
    }),
  ])
  await shareSnsButton(type, event, community, shop!, _window)
}
</script>

<template>
  <v-dialog v-model="model" :width="$vuetify.display.smAndDown ? 'auto' : 650" persistent>
    <v-card v-if="event != null" class="px-sm-15 py-sm-9 pa-2 pre-line">
      <v-card-title class="text-center text-h3">注文完了🎉</v-card-title>
      <v-card-text class="text-center text-h5 px-0 py-3"> 参加申し込みが完了しました！ </v-card-text>
      <div class="mx-4">
        <v-img class="mx-0" cover aspect-ratio="1.91" :src="event.event_cover_url" />
        <v-card-text class="text-left pb-3 px-0 text-h5">
          {{ event.event_name }}
        </v-card-text>
        <v-card-text class="text-left pb-1 px-0">
          📅 日時： {{ $d(event.event_start_datetime.toDate(), 'datetime_weekday_short') }}〜{{
            $d(event.event_end_datetime.toDate(), 'time')
          }}
        </v-card-text>
        <v-card-text class="text-left pb-1 px-0">
          ⏳ 期限： {{ $d(event.event_deadline_datetime.toDate(), 'datetime_weekday_short') }} に注文締切
        </v-card-text>
        <v-card-text class="text-left pb-1 px-0">
          📍 場所： {{ event.event_address }} {{ event.event_place }}
        </v-card-text>
        <v-card-text class="text-left pb-1 px-0">👥 主催： {{ event.community_name }}</v-card-text>
        <v-card-text class="text-left pb-1 px-0">👩‍🍳 食事： {{ event.shop_name }}</v-card-text>
        <v-card-text
          v-if="typeof event.event_sns_hash_tag === 'string' && event.event_sns_hash_tag.trim() !== ''"
          class="text-left pb-1 px-0"
        >
          #️⃣ ハッシュタグ：
          <a :href="`https://x.com/search?q=%23${event.event_sns_hash_tag}`" target="_blank">
            #{{ event.event_sns_hash_tag }}
          </a>
        </v-card-text>
        <v-row>
          <v-card-text class="text-center mt-3">
            <v-btn
              class="ma-2"
              size="x-large"
              color="grey-900"
              :append-icon="mdiSend"
              rounded="pill"
              @click="onShareSnsButtonClicked('twitterAfterOrder', event)"
            >
              X で参加予定をシェアする
            </v-btn>
          </v-card-text>
        </v-row>
        <v-card-text class="text-center px-0 py-1">
          <v-btn
            :prepend-icon="mdiContentCopy"
            class="mx-1"
            size="small"
            color="grey-600"
            rounded="pill"
            variant="text"
            @click="onShareSnsButtonClicked('copy', event)"
          >
            テキストコピー
          </v-btn>
          <v-btn
            :prepend-icon="mdiCloseCircle"
            class="mx-1"
            size="small"
            color="grey-600"
            rounded="pill"
            variant="text"
            @click="model = false"
          >
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
