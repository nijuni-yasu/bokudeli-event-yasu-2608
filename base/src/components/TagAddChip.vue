<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiPlus } from '@mdi/js'
import TagSettingsDialog from '@shokujii/base/components/TagSettingsDialog.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const { t: $t } = useI18n()
const currentUserStore = useCurrentUserStore()

const tagDialog = ref(false)

const isLoggedIn = computed(() => currentUserStore.firebaseUser != null)
</script>

<template>
  <template v-if="isLoggedIn">
    <v-chip
      color="primary"
      variant="outlined"
      size="x-small"
      :prepend-icon="mdiPlus"
      :class="['tag-add-chip', 'cursor-pointer', { 'tag-add-chip--compact': compact, 'ma-1': !compact }]"
      @click.stop.prevent="tagDialog = true"
    >
      {{ $t('user_tags.add_tag') }}
    </v-chip>
    <TagSettingsDialog v-model="tagDialog" />
  </template>
</template>

<style lang="scss" scoped>
.tag-add-chip--compact.v-chip {
  --v-chip-size: 0.6875rem;
  --v-chip-height: 20px;
  font-size: 0.6875rem;
  line-height: 1.2;
  padding: 0 5px;
  margin: 0 2px 4px 0;

  :deep(.v-chip__prepend .v-icon) {
    font-size: 0.6875rem;
  }
}
</style>
