<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TagBadge from '@shokujii/base/components/TagBadge.vue'
import TagAddChip from '@shokujii/base/components/TagAddChip.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'

const { t: $t } = useI18n()
const currentUserStore = useCurrentUserStore()

const tags = computed(() => currentUserStore.user?.user_tags ?? [])
</script>

<template>
  <div class="user-profile-tags-edit-section">
    <div class="text-subtitle-2 mb-2">{{ $t('user_tags.section_title') }}</div>
    <div class="d-flex flex-wrap align-center ga-1">
      <TagBadge v-for="t in tags" :key="t" :tag="t" highlighted />
      <span v-if="tags.length === 0" class="text-body-2 text-medium-emphasis me-2">
        {{ $t('user_tags.section_empty') }}
      </span>
      <TagAddChip />
    </div>
  </div>
</template>
