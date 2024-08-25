<script setup lang="ts">
import type BokudeliEvent from '../schemes//bokudeliEvent'
import type { EventMember } from '../schemes/EventMember'
import UserAvatar from './UserAvatar.vue'

defineProps<{ event: BokudeliEvent; members?: EventMember[] }>()
</script>

<template>
  <v-card class="text-start">
    <div>
      <VImg cover class="mx-auto" aspect-ratio="1.91" :src="event.event_cover_url" />
    </div>
    <v-chip class="mt-2 ml-3" color="primary" size="small">
      {{ $t(`event_status.${event.event_status.value}`) }}
    </v-chip>
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
    <template v-if="members != null">
      <v-card-title class="text-left px-3 pt-0 pb-3 text-subtitle-2" style="line-height: 1.75rem">
        {{ $t('event_card.participants', [members.length, event.event_max_people]) }}
      </v-card-title>
      <!-- Mutual members -->
      <v-card-text class="position-relative px-3">
        <div class="d-flex justify-space-between align-center">
          <div class="v-avatar-group">
            <UserAvatar v-for="member in members.slice(0, 12) ?? []" :key="member.user_id" :user="member" :size="40" />
          </div>
        </div>
      </v-card-text>
    </template>
  </v-card>
</template>
