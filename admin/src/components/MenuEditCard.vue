<script setup lang="ts">
import { parseISO, format } from 'date-fns'
import { watch } from 'vue'
import { type BokudeliPartnerMenu } from '@shokujii/base/stores/partner.js'
import { useValidators } from '@shokujii/base/composable/validators.js'
import { useI18n } from 'vue-i18n'
import ImageInput from '@shokujii/base/components/ImageInput.vue'
import DateInput from '@shokujii/base/components/DateInput.vue'

const { requiredValidator, maxLengthValidator, betweenValidator } = useValidators()
const { t: $t } = useI18n()

const menu = defineModel<BokudeliPartnerMenu>({ required: true })

defineProps<{ imageUrl: string }>()

const emit = defineEmits<{
  save: [menu: BokudeliPartnerMenu, file: File | null]
  cancel: []
}>()

const imageFile = ref<File | null>(null)

const isValid = ref(false)
const formRef = ref()

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
    menu.value.menu_date_start = value == null ? null : parseISO(value).getTime()
  },
})
const dateEnd = computed({
  get: () => (menu.value.menu_date_end == null ? null : format(menu.value.menu_date_end, 'yyyy-MM-dd')),
  set: (value) => {
    menu.value.menu_date_end = value == null ? null : parseISO(value).getTime() + 24 * 60 * 60 * 1000 - 1
  },
})

// 販売期間のバリデーションを入力欄に紐付ける
const dateRangeRule = (): true | string => {
  const hasStart = menu.value.menu_date_start != null
  const hasEnd = menu.value.menu_date_end != null

  // 片方だけ設定されている場合はエラー
  if (hasStart !== hasEnd) {
    return $t('menu_edit_card.error_date_range_incomplete')
  }
  // 両方設定されている場合、開始日 <= 終了日であることを確認
  if (hasStart && hasEnd && menu.value.menu_date_start! > menu.value.menu_date_end!) {
    return $t('menu_edit_card.error_date_range_invalid')
  }

  return true
}
const dateRangeRules = [dateRangeRule]

// 販売期間のバリデーションを入力欄に紐付けて、変更を監視する
watch(
  () => [menu.value.menu_date_start, menu.value.menu_date_end],
  () => {
    if (!formRef.value) return
    formRef.value.validate()
  },
)

const handleSubmit = () => {
  if (!isValid.value) {
    return
  }
  emit('save', menu.value, imageFile.value)
}
</script>

<template>
  <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubmit">
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
              :urls="[imageUrl]"
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
          :rules="[requiredValidator, (v: string) => maxLengthValidator(v, 140)]"
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
            <DateInput
              v-model="dateStart"
              :clearable="true"
              :label="$t('menu_edit_card.date_start')"
              :rules="dateRangeRules"
            />
          </v-col>
          <v-col cols="6">
            <DateInput
              v-model="dateEnd"
              :clearable="true"
              :label="$t('menu_edit_card.date_end')"
              :rules="dateRangeRules"
            />
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
