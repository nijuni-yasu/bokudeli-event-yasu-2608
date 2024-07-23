<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BokudeliEvent, { eventPaymentItems } from '@/schemes/bokudeliEvent'
import { dateString, hourString, minutesString, hourList, minutesList } from '@/schemes/eventCreate'
import { useValidators } from '@/composable/validators'
import { mdiListBoxOutline, mdiLightbulbOnOutline, mdiAccountCreditCardOutline } from '@mdi/js'
import ImageInput from '../ImageInput.vue'
import DateInput from '../DateInput.vue'

withDefaults(
  defineProps<{
    readonly?: boolean
    subdomainTags?: string[]
  }>(),
  {
    readonly: false,
  },
)

const { t: $t } = useI18n()

const event = defineModel<BokudeliEvent>({ required: true })
const coverImage = defineModel<File | null>('coverImage', { required: true })

const { requiredValidator, positiveIntegerValidator } = useValidators()
const maxPeopleValidator = (v: number) => {
  if (v < event.value.event_num_members) {
    return $t('event_detail.error_max_people', [event.value.event_num_members])
  }
  return true
}

if (event.value.event_max_people == 0) {
  event.value.event_max_people = 25
}

const eventDeadlineDate = computed(() => dateString(event.value.event_deadline_datetime?.toDate() ?? null))
const eventDeadlineHour = computed(() => hourString(event.value.event_deadline_datetime?.toDate() ?? null))
const eventDeadlineMinute = computed(() => minutesString(event.value.event_deadline_datetime?.toDate() ?? null))
</script>

<template>
  <v-card flat class="mt-2">
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiListBoxOutline" />
      {{ $t('event_detail.title') }}
    </v-card-title>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="event.event_name"
            outlined
            dense
            :label="$t('event_detail.event_name')"
            :rules="[requiredValidator]"
            :readonly="readonly"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text v-if="subdomainTags != null && subdomainTags.length !== 0" class="pt-5">
      <v-row>
        <v-col cols="12">
          <v-text-field outlined dense label="Tags" :readonly="true" :active="true">
            <v-chip-group v-model="event.subdomain_tags" selected-class="text-primary" multiple>
              <v-chip v-for="tag in subdomainTags" :key="tag" :text="$t(`subdomain_tags.${tag}`)" :value="tag" />
            </v-chip-group>
          </v-text-field>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12">
          <ImageInput
            style="min-width: 360px; min-height: 189px"
            :url="event.event_cover_url"
            :rules="[requiredValidator]"
            :readonly="readonly"
            @fileSelected="(f) => (coverImage = f)"
          >
            <template #placeholder>{{ $t('event_detail.event_cover_url') }}</template>
          </ImageInput>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12">
          <v-textarea
            v-model="event.event_desc"
            outlined
            rows="10"
            :label="$t('event_detail.event_desc')"
            :rules="[requiredValidator]"
            :readonly="readonly"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12" sm="12" md="6">
          <DateInput
            :label="$t('event_detail.deadline_date')"
            v-model="eventDeadlineDate"
            :readonly="true"
            :clearable="false"
          />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            :model-value="eventDeadlineHour"
            :items="hourList"
            outlined
            dense
            :label="$t('event_detail.deadline_hour')"
            :readonly="true"
          ></v-select>
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            :model-value="eventDeadlineMinute"
            :items="minutesList"
            outlined
            dense
            :label="$t('event_detail.deadline_minute')"
            :readonly="true"
          ></v-select>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model.number="event.event_max_people"
            type="number"
            outlined
            dense
            :label="$t('event_detail.event_max_people')"
            :rules="[requiredValidator, positiveIntegerValidator, maxPeopleValidator]"
            :readonly="readonly"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Activity -->
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiLightbulbOnOutline" />
      {{ $t('event_detail.activity') }}
    </v-card-title>
    <v-card-text>
      <v-switch v-model="event.is_public" hide-details class="mt-0" :readonly="readonly">
        <template v-slot:label>
          <span v-if="event.is_public">{{ $t('event_detail.public') }}</span>
          <span v-else>{{ $t('event_detail.private') }}</span>
        </template>
      </v-switch>
      <div>
        <span v-if="event.is_public">{{ $t('event_detail.public_desc') }}</span>
        <span v-else>{{ $t('event_detail.private_desc') }}</span>
      </div>
    </v-card-text>
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiAccountCreditCardOutline" />
      {{ $t('event_detail.payment') }}
    </v-card-title>
    <v-card-text>
      <v-col cols="12" sm="12" md="6">
        <v-select
          v-model="event.event_payment"
          :disabled="true"
          :items="eventPaymentItems"
          hide-details
          class="mt-0"
          :rules="[requiredValidator]"
        >
          <template #label> {{ $t('event_detail.payment') }} </template>
        </v-select>
      </v-col>
    </v-card-text>
    <slot />
  </v-card>
</template>
