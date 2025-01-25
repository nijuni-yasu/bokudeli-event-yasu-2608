<script setup lang="ts">
import _ from 'lodash'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { useEventStore, type EventStore } from '@/stores/event'
import DateInput from '@/components/DateInput.vue'
import type { Letter } from '@/schemes/letter'
import { Timestamp } from 'firebase/firestore'
import { useLetterListStore } from '@/stores/letterList'
import {
  hourList,
  minutesList,
  dateString,
  hourString,
  minutesString,
  parseDateTimeStrings,
} from '@/schemes/eventCreate'
import { useValidators } from '@/composable/validators'

const router = useRouter()
const { requiredValidator } = useValidators()

const props = defineProps<{
  letter: Letter
}>()

const emit = defineEmits<{
  (e: 'update:letter', letter: Letter): void
}>()

const _letter = ref<Letter>(_.clone(toRaw(props.letter)))

const letterListStore = useLetterListStore(props.letter.community_account)
const communityStore = useCommunityStore(props.letter.community_account) as CommunityStore
const eventStore = props.letter.event_id == null ? null : (useEventStore(props.letter.event_id) as EventStore)

const numCommunityMembers = computed(() => communityStore.community?.community_num_members)
const numEventMembers = computed(() => eventStore?.event?.members?.length)

const isValid = ref(false)

const isScheduled = ref(false)
const scheduleTime = ref(Timestamp.now())

const scheduledDate = computed({
  get: () => dateString(scheduleTime.value.toDate() ?? null),
  set: (value) => {
    scheduleTime.value = Timestamp.fromDate(parseDateTimeStrings(value, scheduledHour.value, scheduledMinute.value))
  },
})
const scheduledHour = computed({
  get: () => hourString(scheduleTime.value.toDate() ?? null),
  set: (value) => {
    scheduleTime.value = Timestamp.fromDate(parseDateTimeStrings(scheduledDate.value, value, scheduledMinute.value))
  },
})
const scheduledMinute = computed({
  get: () => minutesString(scheduleTime.value.toDate() ?? null),
  set: (value) => {
    scheduleTime.value = Timestamp.fromDate(parseDateTimeStrings(scheduledDate.value, scheduledHour.value, value))
  },
})

const submit = async () => {
  const now = Timestamp.now()
  _letter.value.scheduled_at = isScheduled ? scheduleTime.value : now
  _letter.value.status = 'timed'
  if (_letter.value.letter_id == null) {
    await letterListStore.addLetter(toRaw(_letter.value))
  } else {
    await letterListStore.updateLetter(toRaw(_letter.value))
  }
  letterListStore.reload()
  emit('update:letter', toRaw(_letter.value))
}
const save = async () => {
  _letter.value.status = 'draft'
  if (_letter.value.letter_id == null) {
    await letterListStore.addLetter(toRaw(_letter.value))
  } else {
    await letterListStore.updateLetter(toRaw(_letter.value))
  }
  letterListStore.reload()
  emit('update:letter', toRaw(_letter.value))
}
</script>

<template>
  <v-form v-model="isValid">
    <v-container>
      <v-card class="pa-15">
        <v-row>
          <v-col cols="12">
            <span class="text-h4">
              {{ _letter.letter_id == null ? $t('manage.letter.edit.new') : $t('manage.letter.edit.edit') }}
            </span>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <span class="text-h5">{{ $t('manage.letter.edit.to') }}</span>
            <v-radio-group v-model="_letter.letter_type">
              <v-radio value="community">
                <template #label>
                  {{ $t('manage.letter.edit.to_community') }}
                  <template v-if="numCommunityMembers != null">
                    {{ $t('manage.letter.edit.number_of_people', [numCommunityMembers]) }}
                  </template>
                </template>
              </v-radio>
              <v-radio v-if="_letter.event_id != null" value="event_participant">
                <template #label>
                  {{ $t('manage.letter.edit.to_event_participant') }}
                  <template v-if="numEventMembers != null">
                    {{ $t('manage.letter.edit.number_of_people', [numEventMembers]) }}
                  </template>
                </template>
              </v-radio>
              <v-radio v-if="_letter.event_id != null" value="event_non_participant">
                <template #label>
                  {{ $t('manage.letter.edit.to_event_non_participant') }}
                  <template v-if="numCommunityMembers != null && numEventMembers != null">
                    {{ $t('manage.letter.edit.number_of_people', [numCommunityMembers - numEventMembers]) }}
                  </template>
                </template>
              </v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <span class="text-h5"></span>
            <v-radio-group v-model="isScheduled">
              <v-radio :value="false" :label="$t('manage.letter.edit.deliver_now')" />
              <div class="d-flex align-center">
                <v-radio :value="true" style="flex: 0; margin-right: 0; gap: 0" />
                <div class="schedule">
                  <DateInput v-model="scheduledDate" :clearable="false" :disabled="!isScheduled" />
                  <v-select
                    v-model="scheduledHour"
                    :items="hourList"
                    :label="$t('event_basic_info.hour')"
                    :disabled="!isScheduled"
                    outlined
                    dense
                  />
                  <v-select
                    v-model="scheduledMinute"
                    :items="minutesList"
                    :label="$t('event_basic_info.minute')"
                    :disabled="!isScheduled"
                    outlined
                    dense
                  />
                  UTC +9:00
                </div>
              </div>
            </v-radio-group>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <span class="text-h5">{{ $t('manage.letter.edit.subject') }}</span>
            <v-text-field v-model="_letter.letter_title" :rules="[requiredValidator]" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <span class="text-h5">{{ $t('manage.letter.edit.message') }}</span>
            <v-textarea v-model="_letter.letter_content" :rules="[requiredValidator]" />
          </v-col>
        </v-row>
        <!-- <v-row v-if="eventStore?.event != null">
          <v-col cols="12">
            <v-checkbox :label="$t('manage.letter.edit.add_event_description')"></v-checkbox>
            <span class="font-weight-bold">{{ $t('manage.letter.edit.event_description') }}</span>
            <div>
              {{ eventStore.event.event_desc }}
            </div>
          </v-col>
        </v-row> -->
        <v-row>
          <v-col cols="12" style="display: flex; gap: 10px">
            <v-btn @click="save" variant="outlined" :disabled="!isValid">
              {{ _letter.status === 'draft' ? $t('manage.letter.edit.save_draft') : $t('manage.letter.edit.to_draft') }}
            </v-btn>
            <v-btn @click="submit" :disabled="!isValid">
              {{ isScheduled ? $t('manage.letter.edit.submit_reserve') : $t('manage.letter.edit.submit_now') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-container>
  </v-form>
</template>

<style>
.picker .v-label {
  width: 100%;
}
</style>

<style scoped>
.schedule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
}
</style>
