<script setup lang="ts">
import { computed } from 'vue'
import type BokudeliEvent from '../schemes//bokudeliEvent'
import type { EventMember } from '../schemes/EventMember'
import UserAvatar from './UserAvatar.vue'
import { useDisplay } from 'vuetify'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'

defineProps<{ event: BokudeliEvent; members?: EventMember[] }>()

const display = useDisplay()
const avatarSize = computed(() => {
  switch (display.name.value) {
    case 'xs':
      return 60
    case 'sm':
      return 65
    case 'md':
      return 44
    default:
      return 48
  }
})
</script>

<template>
  <v-card class="text-start">
    <div>
      <VImg cover class="mx-auto" aspect-ratio="1.91" :src="event.event_cover_url" />
    </div>
    <EventStatusChip :status="event.event_status.value" size="x-small" class="mt-2 ml-2" />
    <v-card-title class="justify-center px-3 py-1" style="font-size: 16px; font-weight: 600">
      {{ event.event_name }}
    </v-card-title>
    <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height: 1.75rem">
      {{ $t('event_card.community_name', [event.community_name]) }}
    </v-card-title>
    <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height: 1.75rem">
      <template v-if="event.event_start_datetime != null && event.event_end_datetime != null">
        {{
          $t('event_card.date', [
            $d(event.event_start_datetime.toDate(), 'datetime_weekday_short'),
            $d(event.event_end_datetime.toDate(), 'time'),
          ])
        }}
      </template>
    </v-card-title>
    <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height: 1.75rem">
      {{ $t('event_card.place', [event.event_address]) }}
    </v-card-title>
    <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height: 1.75rem">
      {{ $t('event_card.shop', [event.shop_name]) }}
    </v-card-title>
    <v-card-text class="text-left px-3 pt-0 pb-1 text-subtitle-2" style="line-height: 1.75rem">
      {{ $t('event_card.participants', [(members ?? []).length, event.event_max_people]) }}
    </v-card-text>
    <!-- Mutual members -->
    <v-card-text class="position-relative px-3 pb-2" style="min-height: 50px">
      <div class="d-flex justify-space-between align-center">
        <div class="v-avatar-group">
          <UserAvatar
            v-for="member in (members ?? []).slice(0, 7)"
            :key="member.user_id"
            :user="member"
            :size="avatarSize"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
