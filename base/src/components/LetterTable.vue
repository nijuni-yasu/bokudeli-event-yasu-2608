<script setup lang="ts">
import { ref, computed } from 'vue'
import { type BokudeliLetter } from '@shokujii/base/stores/letter.js'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event'
import { getManageEventPath } from '@/router/utils'
import LetterStatusChip from '@shokujii/base/components/LetterStatusChip.vue'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community'
import { useUserStore } from '@shokujii/base/stores/user.js'
import { mdiPencil, mdiDelete, mdiContentCopy } from '@mdi/js'

const props = defineProps<{ letters: BokudeliLetter[] }>()

const emits = defineEmits<{
  letters: [BokudeliLetter[]]
  edit: [BokudeliLetter]
  copy: [BokudeliLetter]
  delete: [BokudeliLetter]
  'user-click': [string]
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

const individualUserStores = computed(() => {
  const stores = new Map<string, ReturnType<typeof useUserStore>>()
  props.letters.forEach((letter) => {
    if (letter.letter_type === 'individual' && letter.user_id && !stores.has(letter.user_id)) {
      stores.set(letter.user_id, useUserStore(letter.user_id))
    }
  })
  return stores
})

const getNumberOfTargets = (letter: BokudeliLetter) => {
  const communityStore = letter.community_account ? communityStores.value.get(letter.community_account) : null
  const eventStore = letter.event_id ? eventStores.value.get(letter.event_id) : null

  switch (letter.letter_type) {
    case 'community':
      return communityStore?.community?.members?.length ?? null
    case 'event_participant':
      if (eventStore == null) {
        return null
      }
      return eventStore.event?.members?.length ?? null
    case 'event_non_participant':
      if (eventStore?.event == null || communityStore?.community == null) {
        return null
      }
      return communityStore.community.members.length - eventStore.event.members.length
    case 'individual':
      return 1
    default:
      return null
  }
}

const getIndividualUserName = (letter: BokudeliLetter): string | null => {
  if (letter.letter_type !== 'individual' || letter.user_id == null || letter.user_id === '') {
    return null
  }
  return individualUserStores.value.get(letter.user_id)?.user?.user_name ?? null
}

const deleteConfirmationDialog = ref(false)
const letterToDelete = ref<BokudeliLetter | null>(null)
const showDeleteConfirmation = (letter: BokudeliLetter) => {
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
  <v-card v-if="letters.length === 0" class="pa-10">
    <div v-html="$t('letter_table.no_letters')" />
  </v-card>
  <v-card v-else class="pa-8">
    <div class="letter-table-wrapper">
      <v-table class="letter-table">
        <thead>
          <tr>
            <th class="text-left status-cell">{{ $t('letter_table.status') }}</th>
            <th class="text-left content-cell">{{ $t('letter_table.content') }}</th>
            <th class="text-left type-cell">{{ $t('letter_table.type') }}</th>
            <th class="text-left target-cell">{{ $t('letter_table.num_targets') }}</th>
            <th class="text-left date-cell">{{ $t('letter_table.scheduled_at') }}</th>
            <th class="text-left date-cell">{{ $t('letter_table.updated_at') }}</th>
            <th class="text-left actions-cell"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="letter of letters" :key="letter.letter_id">
            <tr>
              <td class="status-cell">
                <LetterStatusChip :status="letter.status" size="x-small" class="ma-2" />
              </td>
              <td class="py-5 content-cell">
                <div class="text-h6 font-weight-bold mb-1 content-title" :title="letter.letter_title">
                  {{ letter.letter_title }}
                </div>
                <div class="text-body-2 content-body" :title="letter.letter_content">
                  {{ letter.letter_content }}
                </div>
              </td>
              <td class="text-body-2 type-cell">
                {{ $t(`letter_type.${letter.letter_type}`) }}<br />
                <template v-if="letter.letter_type === 'individual'">
                  <a
                    v-if="letter.user_id"
                    href="#"
                    class="text-primary"
                    @click.prevent="$emit('user-click', letter.user_id)"
                  >
                    {{ getIndividualUserName(letter) }}
                  </a>
                  <span v-else>{{ getIndividualUserName(letter) }}</span>
                </template>
                <template v-else-if="letter.event_id && eventStores.get(letter.event_id)?.event">
                  <router-link :to="{ path: getManageEventPath(letter.event_id) }">
                    {{ eventStores.get(letter.event_id)?.event?.event_name }}
                  </router-link>
                </template>
              </td>
              <td class="text-body-2 target-cell">
                {{ getNumberOfTargets(letter) }}
              </td>
              <td class="text-body-2 date-cell">
                {{ letter.scheduled_at ? $d(letter.scheduled_at, 'datetime') : '-' }}
              </td>
              <td class="text-body-2 date-cell">
                {{ letter.updated_at ? $d(letter.updated_at, 'datetime') : '-' }}
              </td>
              <td class="actions-cell">
                <div v-if="letter.letter_type !== 'individual'" class="actions-cell-content">
                  <v-btn
                    v-if="letter.status !== 'sent'"
                    class="my-2"
                    variant="outlined"
                    size="small"
                    :prepend-icon="mdiPencil"
                    @click="$emit('edit', letter)"
                    >{{ $t('letter_table.edit') }}</v-btn
                  >
                  <v-btn
                    v-if="letter.status !== 'sent'"
                    class="my-2"
                    variant="outlined"
                    size="small"
                    :prepend-icon="mdiDelete"
                    @click="showDeleteConfirmation(letter)"
                    >{{ $t('letter_table.delete') }}</v-btn
                  >
                  <v-btn
                    class="my-2"
                    variant="outlined"
                    size="small"
                    :prepend-icon="mdiContentCopy"
                    @click="$emit('copy', letter)"
                    >{{ $t('letter_table.copy') }}</v-btn
                  >
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>
    </div>
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
.letter-table-wrapper {
  overflow-x: auto;
}
.letter-table :deep(table) {
  table-layout: fixed;
  width: 100%;
  min-width: 780px;
}

.status-cell {
  padding: 0px 10px 0px 10px !important;
  width: 90px !important;
}
.content-cell {
  width: 40% !important;
  min-width: 200px;
}
.content-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.content-body {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  overflow: hidden;
  text-overflow: ellipsis;
}
.type-cell {
  width: 160px !important;
}
.target-cell {
  width: 80px !important;
  text-align: center;
  white-space: nowrap;
}
.date-cell {
  width: 110px !important;
}
.actions-cell {
  width: 100px !important;
}
.actions-cell-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
