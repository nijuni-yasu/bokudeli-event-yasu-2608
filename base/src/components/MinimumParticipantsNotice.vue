<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { convertToDatetimeWeekdayShort } from '@shokujii/common/utils/datetime.js'
import type { MinimumParticipantsType } from '@shokujii/common/schemas/Event.js'

const props = defineProps<{
  minimumParticipants: MinimumParticipantsType
}>()

const { t: $t } = useI18n()

const judgmentDisplay = computed(() => convertToDatetimeWeekdayShort(props.minimumParticipants.judgment_datetime))
</script>

<template>
  <v-alert type="info" variant="tonal" class="my-4" density="comfortable">
    <div class="text-body-2 font-weight-bold mb-2">
      {{ $t('event_detail.minimum_participants.public_title') }}
    </div>
    <div class="text-body-2">
      {{
        $t('event_detail.minimum_participants.public_body', {
          count: minimumParticipants.count,
          days: minimumParticipants.judgment_days_before,
          judgment: judgmentDisplay,
        })
      }}
    </div>
    <div class="text-body-2 mt-2">
      {{ $t('event_detail.minimum_participants.public_model_a_note') }}
    </div>
  </v-alert>
</template>
