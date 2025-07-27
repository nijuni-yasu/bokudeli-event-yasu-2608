<script setup lang="ts">
import { ref, computed } from 'vue'
import { type Letter } from '../schemes/letter'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event'

const props = defineProps<{ letter: Letter }>()

// 表示用コンポーネントの中で pinia を直接叩くのは望ましくないが、
// それを避けるためだけに新たなレイヤを作るより、現状ではこの方が良いと判断した
// より複雑になる場合は、データ構造の変更から検討する必要がある
const communityStore = useCommunityStore(props.letter.community_account) as CommunityStore
let eventStore: EventStore | null = null
if (props.letter.event_id != null) {
  eventStore = useEventStore(props.letter.event_id) as EventStore
}

const numberOfTargets = computed(() => {
  switch (props.letter.letter_type) {
    case 'community':
      return communityStore.community?.community_num_members
    case 'event_participant':
      if (eventStore == null) {
        return null
      }
      return eventStore.event?.event_num_members
    case 'event_non_participant':
      if (eventStore?.event == null || communityStore.community == null) {
        return null
      }
      return communityStore.community.community_num_members - eventStore.event.event_num_members
    default:
      return null
  }
})
const deleteConfirmationDialog = ref(false)
</script>

<template>
  <v-card class="text-start pa-2">
    <v-chip class="mt-2 ml-3" color="primary" size="small">
      {{ $t(`letter_status.${letter.status}`) }}
    </v-chip>
    <v-card-title style="font-size: 16px; font-weight: 600">
      {{ letter.letter_title }}
    </v-card-title>
    <v-card-text class="text-body-2" style="line-height: 1.5rem">
      {{ $t('letter_card.updated_at', [$d(letter.updated_at.toDate(), 'datetime')]) }}<br />
      <template v-if="letter.status === 'sent'">
        {{ $t('letter_card.sent_at', [$d(letter.sent_at!.toDate(), 'datetime')]) }}<br />
      </template>
      <template v-if="letter.status === 'timed'">
        {{ $t('letter_card.scheduled_at', [$d(letter.scheduled_at!.toDate(), 'datetime')]) }}<br />
      </template>
      {{ $t('letter_card.type', [$t(`letter_type.${letter.letter_type}`), numberOfTargets]) }}<br />
      <template v-if="eventStore?.event != null">
        {{ $t('letter_card.event_name', [eventStore.event.event_name]) }}<br />
      </template>
    </v-card-text>
    <template v-slot:actions>
      <v-btn v-if="letter.status !== 'sent'" variant="outlined" @click="$emit('edit')">
        {{ $t('letter_card.edit') }}
      </v-btn>
      <v-btn variant="outlined" @click="$emit('copy')">{{ $t('letter_card.copy') }}</v-btn>
      <v-btn v-if="letter.status !== 'sent'" variant="outlined" @click="deleteConfirmationDialog = true">
        {{ $t('letter_card.delete') }}
      </v-btn>
    </template>
  </v-card>
  <v-dialog v-model="deleteConfirmationDialog" max-width="600px">
    <v-card class="pa-2">
      <v-card-title>
        {{ $t('letter_card.dialog.title') }}
      </v-card-title>
      <v-card-text>
        {{ $t('letter_card.dialog.description') }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteConfirmationDialog = false">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn variant="tonal" @click="$emit('delete')">
          {{ $t('letter_card.dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
