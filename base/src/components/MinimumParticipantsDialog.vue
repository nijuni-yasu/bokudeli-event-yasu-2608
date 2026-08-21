<script setup lang="ts">
import { computed } from 'vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { convertToDatetimeWeekdayShort } from '@shokujii/common/utils/datetime.js'
import type { MinimumParticipantsType } from '@shokujii/common/schemas/Event.js'

const isOpenDialog = defineModel<boolean>({ required: true })

const props = defineProps<{
  minimumParticipants: MinimumParticipantsType
}>()

const judgmentDisplay = computed(() => convertToDatetimeWeekdayShort(props.minimumParticipants.judgment_datetime))

const belowCount = computed(() => Math.max(0, props.minimumParticipants.count - 1))
</script>

<template>
  <confirm-dialog v-model="isOpenDialog" :is-confirm="false">
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('event_detail.minimum_participants.public_title') }}
    </v-card-text>
    <v-card-text class="pb-6 px-6">
      <div
        class="minimum-participants-public-body"
        v-html="
          $t('event_detail.minimum_participants.public_body', {
            count: minimumParticipants.count,
            days: minimumParticipants.judgment_days_before,
            judgment: judgmentDisplay,
            below: belowCount,
          })
        "
      />
    </v-card-text>
  </confirm-dialog>
</template>

<style scoped>
.minimum-participants-public-body {
  font-size: 14px;
  line-height: 1.5;
}
</style>
