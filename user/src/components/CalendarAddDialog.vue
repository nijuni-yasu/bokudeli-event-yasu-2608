<script setup lang="ts">
import buildCalendarLink from '@/composable/buildCalendarLink'
import BokudeliEvent from '@/schemes/bokudeliEvent'

const props = defineProps<{
  modelValue: boolean
  event: BokudeliEvent
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const googleCalendarLink = computed(() => {
  return buildCalendarLink(props.event, 'google')
})

const icsLink = computed(() => {
  return buildCalendarLink(props.event, 'ics')
})

const closeDialog = () => {
  dialog.value = false
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="600px">
    <v-card>
      <v-card-title class="text-center mt-10">
        <div class="text-h5 ma-1">カレンダーに追加</div>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col class="d-flex justify-center">
              <a :href="googleCalendarLink" target="_blank">
                <v-btn class="add-button" color="grey-900" variant="outlined">Google カレンダーに追加</v-btn>
              </a>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="d-flex justify-center">
              <a :href="icsLink" target="_blank">
                <v-btn class="add-button" color="grey-900" variant="outlined">icsファイルをダウンロード</v-btn>
              </a>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" text @click="closeDialog">閉じる</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.add-button {
  width: 345px;
  height: 54px;
  border-radius: 10px;
}
</style>
