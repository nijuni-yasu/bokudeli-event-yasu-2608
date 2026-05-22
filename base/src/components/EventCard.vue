<script setup lang="ts">
import { computed } from 'vue'
import { type BokudeliEvent, type BokudeliEventMember, useEventStore } from '@shokujii/base/stores/event.js'
import UserAvatar from './UserAvatar.vue'
import { useDisplay } from 'vuetify'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'
import { convertToDatetimeWeekdayShort, convertToTimeString } from '@shokujii/common/utils/datetime.js'

const props = defineProps<{ event: BokudeliEvent; members?: BokudeliEventMember[] }>()
const eventStore = useEventStore(props.event.event_id)

const display = useDisplay()
const avatarSize = computed(() => {
  switch (display.name.value) {
    case 'xs':
      return 60
    case 'sm':
      return 65
    case 'md':
      return 60
    default:
      return 60
  }
})
</script>

<template>
  <v-card class="text-start">
    <div>
      <VImg cover class="mx-auto" aspect-ratio="1.91" :src="eventStore.coverImageUrl" />
    </div>
    <EventStatusChip :status="event.calculatedEventStatus" size="x-small" class="mt-2 ml-2" />
    <v-card-title class="event-card__title-outer px-3 py-1">
      <div class="event-card__event-name text-lg font-weight-semibold text-sm-body-1 w-100">
        {{ event.event_name }}
      </div>
    </v-card-title>
    <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height: 1.75rem">
      {{ $t('event_card.community_name', [event.community_name]) }}
    </v-card-title>
    <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height: 1.75rem">
      <template v-if="event.event_start_datetime != null && event.event_end_datetime != null">
        {{
          $t('event_card.date', [
            convertToDatetimeWeekdayShort(event.event_start_datetime),
            convertToTimeString(event.event_end_datetime),
          ])
        }}
      </template>
    </v-card-title>
    <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height: 1.75rem">
      {{ $t('event_card.place', [event.fullAddress]) }}
    </v-card-title>
    <v-card-title class="text-left px-3 pt-0 pb-2 text-subtitle-2" style="line-height: 1.75rem">
      {{ $t('event_card.shop', [event.shop_name]) }}
    </v-card-title>
    <!--
      実験的に非表示: event_card.participants の人数表示。
      参加人数を気しない方が参加率は高まるかの検証。本採用時はコメントを外して有効化する。
    -->
    <!-- <v-card-text class="text-left px-3 pt-0 pb-1 text-subtitle-2" style="line-height: 1.75rem">
      {{ $t('event_card.participants', [(members ?? []).length, event.event_max_people]) }}
    </v-card-text> -->
    <!-- Mutual members -->
    <v-card-text class="position-relative px-3 pb-2 avatar-scroll-container" style="min-height: 50px">
      <div class="v-avatar-group">
        <UserAvatar
          v-for="member in (members ?? []).slice(0, 15)"
          :key="member.user_id"
          :user="member"
          :size="avatarSize"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
/* line-clamp を安定させるため v-card-title 直下ではなく内側 div に指定（CommunityCard と同様） */
/* VCardTitle は既定で nowrap + flex のため、複数行省略用に上書きする */
.event-card__title-outer {
  display: flex !important;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  white-space: normal !important;
}

.event-card__event-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  /* autoprefixer: ignore next - line-clamp に必須 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
  /* 1行タイトルでも2行分の高さを確保し、グリッド内のカード縦位置を揃える */
  min-height: calc(2 * 1.35em);
  min-width: 0;
  overflow-wrap: anywhere;
}

.avatar-scroll-container {
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.v-avatar-group > *) {
    &:hover {
      transform: scale(1.05);
    }
  }
}
</style>
