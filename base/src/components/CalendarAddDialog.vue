<script setup lang="ts">
import { computed } from 'vue'
import buildCalendarLink from '@shokujii/base/composable/buildCalendarLink'
import BokudeliEvent from '@shokujii/base/schemes/bokudeliEvent'

const props = defineProps<{
  event: BokudeliEvent
}>()

const dialog = defineModel<boolean>()

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
  <v-dialog v-model="dialog" width="50%" min-width="320px" max-width="480px">
    <v-card>
      <v-card-title class="text-center mt-10">
        <div class="text-h5 ma-1">カレンダーに追加</div>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col class="d-flex justify-center">
              <v-btn
                class="add-button"
                color="grey-900"
                variant="outlined"
                rounded="pill"
                :href="googleCalendarLink"
                target="_blank"
                >Google カレンダー</v-btn
              >
            </v-col>
          </v-row>
          <v-row>
            <v-col class="d-flex justify-center">
              <v-btn class="add-button" color="grey-900" variant="outlined" rounded :href="icsLink" target="_blank"
                >カレンダーアプリ</v-btn
              >
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" @click="closeDialog">閉じる</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.add-button {
  width: 80%;
  max-width: 345px;
  height: 54px;
}
</style>
