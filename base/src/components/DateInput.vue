<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDate } from 'vuetify'
import { mdiCalendar, mdiClose } from '@mdi/js'
import { useI18n } from 'vue-i18n'

const modelValue = defineModel<string | null>({
  required: false,
  default: null,
})

const props = withDefaults(
  defineProps<{
    readonly?: boolean
    clearable?: boolean
    // eslint-disable-next-line no-unused-vars
    allowedDates?: unknown[] | ((value: unknown) => boolean) | undefined
  }>(),
  {
    readonly: false,
    clearable: true,
    allowedDates: undefined,
  },
)

const adapter = useDate()
const { d: $d } = useI18n()

const _menu = ref(false)
const menu = computed({
  get: () => (props.readonly ? false : _menu.value),
  set: (value) => (_menu.value = value),
})
const date = computed<string | null>({
  get: () =>
    modelValue.value != null && adapter.isValid(modelValue.value)
      ? (adapter.parseISO(modelValue.value) as string)
      : null,
  set: (value) => {
    if (value != null && adapter.isValid(value)) {
      modelValue.value = adapter.toISO(value)
    } else {
      modelValue.value = null
    }
  },
})
const displayDate = computed<string>(() => (date.value == null ? '' : $d(date.value, 'date')))
</script>

<template>
  <v-menu v-model="menu" :close-on-content-click="false" :offset-y="true" transition="scale-transition">
    <template v-slot:activator="{ props }">
      <v-text-field
        :model-value="displayDate"
        :prepend-inner-icon="mdiCalendar"
        :append-inner-icon="clearable && modelValue != null ? mdiClose : undefined"
        :readonly="true"
        v-bind="{ ...props, ...$attrs }"
        @click:append-inner.stop="modelValue = null"
      />
    </template>
    <v-date-picker
      v-model="date"
      :hide-header="true"
      :clearable="true"
      :allowed-dates="allowedDates"
      @update:model-value="menu = false"
    />
  </v-menu>
</template>
