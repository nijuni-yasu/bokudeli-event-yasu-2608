<script setup lang="ts">
import BokudeliEvent, { eventPaymentItems } from '@/schemes/bokudeliEvent'
import { dateString, hourString, minutesString, hourList, minutesList } from '@/schemes/eventCreate'
import { useValidators } from '@/composable/validators'
import { mdiListBoxOutline, mdiLightbulbOnOutline, mdiAccountCreditCardOutline } from '@mdi/js'
import ImageInput from '../ImageInput.vue'
import DateInput from '../DateInput.vue'

defineProps<{
  readonly?: boolean | null
}>()

const event = defineModel<BokudeliEvent>({ required: true })
const coverImage = defineModel<File | null>('coverImage', { required: true })

const { requiredValidator, positiveIntegerValidator } = useValidators()

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
      <span>イベント詳細</span>
    </v-card-title>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="event.event_name"
            outlined
            dense
            label="イベントタイトル"
            :rules="[requiredValidator]"
            :readonly="readonly"
          />
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
            <template #placeholder>イベント画像 1200px X 630px</template>
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
            label="イベント詳細"
            :rules="[requiredValidator]"
            :readonly="readonly"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12" sm="12" md="6">
          <DateInput label="注文締切日時" v-model="eventDeadlineDate" :readonly="true" :clearable="false" />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            :model-value="eventDeadlineHour"
            :items="hourList"
            outlined
            dense
            label="時間"
            :readonly="true"
          ></v-select>
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            :model-value="eventDeadlineMinute"
            :items="minutesList"
            outlined
            dense
            label="分"
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
            label="定員数"
            :rules="[requiredValidator, positiveIntegerValidator]"
            :readonly="readonly"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Activity -->
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiLightbulbOnOutline" />
      <span>公開設定</span>
    </v-card-title>
    <v-card-text>
      <v-switch v-model="event.is_public" hide-details class="mt-0" :readonly="readonly">
        <template v-slot:label>
          <span v-if="event.is_public">公開イベント</span>
          <span v-else>限定公開イベント</span>
        </template>
      </v-switch>
      <div>
        <span v-if="event.is_public">※「公開イベント」はTOPページに一覧表示されます。</span>
        <span v-else>※「限定公開イベント」はTOPページに一覧表示されず、URLを知る人だけが参加できます。</span>
      </div>
    </v-card-text>
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiAccountCreditCardOutline" />
      <span>支払い設定</span>
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
          <template #label> 支払い設定 </template>
        </v-select>
      </v-col>
    </v-card-text>
    <slot />
  </v-card>
</template>

<style lang="scss" scoped>
.image-upload-container {
  width: 100%;
  aspect-ratio: 1.91;
  max-width: 1200px;
  max-height: 630px;
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   cursor: pointer;
}

// .placeholder {
//   text-align: center;
// }
</style>
