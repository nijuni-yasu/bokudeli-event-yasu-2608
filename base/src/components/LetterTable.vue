<script setup lang="ts">
import { ref, computed } from 'vue'
import { type Letter } from '../schemes/letter'
import { convertTruncateText } from '@/schemes/converter'
import { useEventStore, type EventStore } from '@/stores/event'
import { getManageEventPath } from '@/router/utils'
import LetterStatusChip from '@/components/LetterStatusChip.vue'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { mdiPencil, mdiDelete, mdiContentCopy } from '@mdi/js'

const props = defineProps<{ letters: Letter[] }>()

const emits = defineEmits<{
  letters: [Letter[]]
  edit: [Letter]
  copy: [Letter]
  delete: [Letter]
}>()

const eventStores = computed(() => {
  const stores = new Map<string, EventStore>()
  props.letters.forEach((letter) => {
    if (letter.event_id && !stores.has(letter.event_id)) {
      const store = useEventStore(letter.event_id)
      stores.set(letter.event_id, store as EventStore)
    }
  })
  return stores
})

// 表示用コンポーネントの中で pinia を直接叩くのは望ましくないが、
// それを避けるためだけに新たなレイヤを作るより、現状ではこの方が良いと判断した
// より複雑になる場合は、データ構造の変更から検討する必要がある
const communityStores = computed(() => {
  const stores = new Map<string, CommunityStore>()
  props.letters.forEach((letter) => {
    if (letter.community_account && !stores.has(letter.community_account)) {
      const store = useCommunityStore(letter.community_account)
      stores.set(letter.community_account, store as CommunityStore)
    }
  })
  return stores
})

const getNumberOfTargets = (letter: Letter) => {
  const communityStore = letter.community_account ? communityStores.value.get(letter.community_account) : null
  const eventStore = letter.event_id ? eventStores.value.get(letter.event_id) : null

  switch (letter.letter_type) {
    case 'community':
      return communityStore?.community?.community_num_members ?? null
    case 'event_participant':
      if (eventStore == null) {
        return null
      }
      return eventStore.event?.event_num_members ?? null
    case 'event_non_participant':
      if (eventStore?.event == null || communityStore?.community == null) {
        return null
      }
      return communityStore.community.community_num_members - eventStore.event.event_num_members
    default:
      return null
  }
}

const deleteConfirmationDialog = ref(false)
const letterToDelete = ref<Letter | null>(null)
const showDeleteConfirmation = (letter: Letter) => {
  letterToDelete.value = letter
  deleteConfirmationDialog.value = true
}
const handleDelete = () => {
  if (letterToDelete.value) {
    emits('delete', letterToDelete.value)
    deleteConfirmationDialog.value = false
    letterToDelete.value = null
  }
}
</script>

<template>
  <v-card class="pa-8">
    <v-table>
      <thead>
        <tr>
          <th class="text-left status-cell">{{ $t('letter_table.status') }}</th>
          <th class="text-left content-cell">{{ $t('letter_table.content') }}</th>
          <th class="text-left type-cell">{{ $t('letter_table.type') }}</th>
          <th class="text-left target-cell">{{ $t('letter_table.num_targets') }}</th>
          <th class="text-left">{{ $t('letter_table.scheduled_at') }}</th>
          <th class="text-left"></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="letter of letters" :key="letter!.letter_id">
          <tr>
            <td class="status-cell">
              <LetterStatusChip :status="letter.status" size="x-small" class="ma-2" />
            </td>
            <td class="py-5 content-cell">
              <div class="text-h6 font-weight-bold mb-1">
                {{ letter.letter_title }}
              </div>
              <div class="text-body-2">
                {{ convertTruncateText(letter.letter_content, 40) }}
              </div>
            </td>
            <td class="text-body-2 type-cell">
              {{ $t(`letter_type.${letter.letter_type}`) }}<br />
              <template v-if="letter.event_id && eventStores.get(letter.event_id)?.event">
                <router-link :to="{ path: getManageEventPath(letter.event_id) }">
                  {{ eventStores.get(letter.event_id)?.event?.event_name }}
                </router-link>
              </template>
            </td>
            <td class="text-body-2 target-cell">
              {{ getNumberOfTargets(letter) }}
            </td>
            <td class="text-body-2">
              {{ letter.scheduled_at ? $d(letter.scheduled_at.toDate(), 'datetime') : '-' }}
            </td>
            <td>
              <v-col class="pa-0">
                <v-btn
                  v-if="letter.status !== 'sent'"
                  class="my-4"
                  variant="outlined"
                  size="small"
                  :prepend-icon="mdiPencil"
                  @click="$emit('edit', letter)"
                  block
                  >{{ $t('letter_table.edit') }}</v-btn
                >
                <v-btn
                  v-if="letter.status !== 'sent'"
                  class="my-4"
                  variant="outlined"
                  size="small"
                  :prepend-icon="mdiDelete"
                  @click="showDeleteConfirmation(letter)"
                  block
                  >{{ $t('letter_table.delete') }}</v-btn
                >
                <v-btn
                  class="my-4"
                  variant="outlined"
                  size="small"
                  :prepend-icon="mdiContentCopy"
                  @click="$emit('copy', letter)"
                  block
                  >{{ $t('letter_table.copy') }}</v-btn
                >
              </v-col>
            </td>
          </tr>
        </template>
      </tbody>
    </v-table>
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
        <v-btn variant="tonal" @click="handleDelete">
          {{ $t('letter_card.dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.status-cell {
  padding: 0px 10px 0px 10px !important;
  width: 100px !important;
}
.content-cell {
  width: 350px !important;
}
.type-cell {
  width: 200px !important;
}
.target-cell {
  width: 80px !important;
}
</style>
