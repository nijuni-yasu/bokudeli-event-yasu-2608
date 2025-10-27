<script setup lang="ts">
import { parseISO, format } from 'date-fns'
import { type BokudeliPartnerMenu } from '@shokujii/base/stores/partner.js'
import { useValidators } from '@shokujii/base/composable/validators.js'
import ImageInput from '@shokujii/base/components/ImageInput.vue'
import DateInput from '@shokujii/base/components/DateInput.vue'

const { requiredValidator, maxLengthValidator, betweenValidator } = useValidators()

const menu = defineModel<BokudeliPartnerMenu>({ required: true })

defineEmits(['save', 'cancel'])

const imageFile = ref<File | null>(null)

const isValid = ref(false)

// v-mode.number が空文字列を受け入れてしまうため、computed を使って型を整える
// TODO: vuetify 3.5.10 以降にアップグレードして
// https://vuetifyjs.com/en/components/number-inputs/#installation
// を使用したほうがよい
const price = computed({
  get: () => menu.value.menu_price,
  set: (value) => {
    if (Number.isInteger(value)) {
      menu.value.menu_price = value
    }
  },
})

const dateStart = computed({
  get: () => (menu.value.menu_date_start == null ? null : format(menu.value.menu_date_start, 'yyyy-MM-dd')),
  set: (value) => {
    menu.value.menu_date_start = value == null ? Date.now() : parseISO(value).getTime()
  },
})
const dateEnd = computed({
  get: () => (menu.value.menu_date_end == null ? null : format(menu.value.menu_date_end, 'yyyy-MM-dd')),
  set: (value) => {
    menu.value.menu_date_end = (value == null ? Date.now() : parseISO(value).getTime()) + 24 * 60 * 60 * 1000 - 1
  },
})
</script>

<template>
  <v-form v-model="isValid" @submit.prevent="$emit('save', menu, imageFile)">
    <v-card class="pa-4">
      <template #title>
        <div class="text-h4">
          <slot name="title" />
        </div>
      </template>
      <v-card-text>
        <v-row justify="center">
          <v-col cols="7">
            <ImageInput
              :url="menu.menu_image_url ?? undefined"
              @file-selected="(f) => (imageFile = f)"
              style="width: auto; max-width: min(600px, 100%); aspect-ratio: 1/1"
              :cover="true"
              :rules="[requiredValidator]"
            />
            {{ $t('menu_edit_card.image_hint') }}
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text>
        <v-text-field
          v-model="menu.menu_name"
          outlined
          dense
          :label="$t('menu_edit_card.name')"
          :rules="[requiredValidator]"
        />
      </v-card-text>
      <v-card-text>
        <v-textarea
          v-model="menu.menu_description"
          outlined
          :label="$t('menu_edit_card.description')"
          :rules="[(v: string) => maxLengthValidator(v, 140)]"
        />
      </v-card-text>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-text-field
              type="number"
              :prefix="$n(0, 'currency').replace('0', '')"
              v-model.number="price"
              :label="$t('menu_edit_card.price')"
              :rules="[requiredValidator, (v: string) => betweenValidator(v, 100, 99999)]"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-title>{{ $t('menu_edit_card.limited_edition') }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <DateInput v-model="dateStart" :clearable="true" :label="$t('menu_edit_card.date_start')" />
          </v-col>
          <v-col cols="6">
            <DateInput v-model="dateEnd" :clearable="true" :label="$t('menu_edit_card.date_end')" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text>
        <v-switch
          v-model="menu.is_sold_out"
          color="#FF0000"
          :label="`${menu.is_sold_out ? $t('menu_edit_card.sold_out') : $t('menu_edit_card.in_stock')}`"
        />
      </v-card-text>
      <template #actions>
        <v-spacer></v-spacer>
        <v-btn variant="plain" @click="$emit('cancel')">
          {{ $t('menu_edit_card.close') }}
        </v-btn>
        <v-btn type="submit" :disabled="!isValid" variant="tonal">
          {{ $t('menu_edit_card.submit') }}
        </v-btn>
      </template>
    </v-card>
  </v-form>
</template>
