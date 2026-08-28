<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { mdiTagOutline } from '@mdi/js'
import TagBadge from '@shokujii/base/components/TagBadge.vue'

const model = defineModel<boolean>({ required: true })

defineEmits<{
  confirm: []
}>()

const { t: $t } = useI18n()
const { smAndDown } = useDisplay()
</script>

<template>
  <v-dialog v-model="model" max-width="480" :fullscreen="smAndDown" transition="dialog-bottom-transition">
    <v-card class="tag-import-hint-dialog pa-sm-9 pa-5">
      <v-card-item class="text-center pb-2 px-0">
        <v-icon :icon="mdiTagOutline" color="primary" size="32" class="mb-2" />
        <v-card-title class="text-h5">{{ $t('user_tags.import_hint_title') }}</v-card-title>
      </v-card-item>

      <v-card-text class="px-0 pt-2 text-body-1">
        <p class="mb-4">{{ $t('user_tags.import_hint_body') }}</p>
        <div class="d-flex flex-column ga-3">
          <div class="d-flex align-center flex-wrap ga-2">
            <TagBadge :tag="$t('user_tags.import_hint_sample_tag')" compact />
            <span class="text-body-2 text-medium-emphasis">{{ $t('user_tags.import_hint_gray') }}</span>
          </div>
          <div class="d-flex align-center flex-wrap ga-2">
            <TagBadge :tag="$t('user_tags.import_hint_sample_tag')" compact highlighted />
            <span class="text-body-2 text-medium-emphasis">{{ $t('user_tags.import_hint_green') }}</span>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-0 pt-2">
        <v-btn block color="primary" @click="$emit('confirm')">{{ $t('user_tags.import_hint_ok') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
