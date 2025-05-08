<script setup lang="ts">
import { ref, computed } from 'vue'
import { type Letter } from '../schemes/letter'
import { convertTruncateText } from '@/schemes/converter'
import { useEventStore, type EventStore } from '@/stores/event'

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

const deleteConfirmationDialog = ref(false)
</script>

<template>
  <v-card class="pa-8">
    <v-table>
      <thead>
        <tr>
          <th class="text-left status-cell">{{ $t('letter_table.status') }}</th>
          <th class="text-left">{{ $t('letter_table.content') }}</th>
          <th class="text-left">{{ $t('letter_table.type') }}</th>
          <th class="text-left">{{ $t('letter_table.num_targets') }}</th>
          <th class="text-left">{{ $t('letter_table.scheduled_at') }}</th>
          <th class="text-left"></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="letter of letters" :key="letter!.letter_id">
          <tr>
            <td class="status-cell">
              <v-chip class="ma-2" color="primary" size="x-small">
                {{ $t(`letter_status.${letter.status}`) }}
              </v-chip>
            </td>
            <td class="py-5 content-cell">
              <div class="text-h6 font-weight-bold mb-1">
                {{ letter.letter_title }}
              </div>
              <div class="text-body-2">
                {{ convertTruncateText(letter.letter_content, 40) }}
              </div>
            </td>
            <td class="text-body-2">
              {{ $t(`letter_type.${letter.letter_type}`) }}<br />
              <template v-if="letter.event_id && eventStores.get(letter.event_id)?.event">
                {{ eventStores.get(letter.event_id)?.event?.event_name }}
              </template>
            </td>
            <td class="text-body-2">
              10
            </td>
            <td class="text-body-2">
              <td>{{ letter.scheduled_at ? $d(letter.scheduled_at.toDate(), 'datetime') : '-' }}</td>
            </td>
            <td>
              <v-btn class="mt-3" variant="outlined" size="small" @click="$emit('edit', letter)" >編集</v-btn><br>
              <v-btn class="my-2" variant="outlined" size="small" @click="$emit('delete', letter)" >削除</v-btn><br>
              <v-btn class="mb-3" variant="outlined" size="small" @click="$emit('copy', letter)" >コピー</v-btn>
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
        <v-btn variant="tonal" @click="$emit('delete')">
          {{ $t('letter_card.dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
