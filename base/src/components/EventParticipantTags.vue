<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TagBadge from '@shokujii/base/components/TagBadge.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { toggleTagOnMyProfile } from '@shokujii/base/apis/userTags.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { sortTagCountRowsByHighlightThenCount } from '@shokujii/base/utils/tagDisplayOrder.js'

const props = defineProps<{
  event: BokudeliEvent
}>()

const { t: $t } = useI18n()
const currentUserStore = useCurrentUserStore()
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const myTags = computed(() => new Set(currentUserStore.user?.user_tags ?? []))

const isHighlighted = (tag: string) => myTags.value.has(tag)

const sortedParticipantTags = computed((): { tag: string; count: number }[] => {
  const m = props.event.event_members_tags
  if (m == null || Object.keys(m).length === 0) return []
  const rows = Object.entries(m).map(([tag, count]) => ({ tag, count }))
  return sortTagCountRowsByHighlightThenCount(rows, isHighlighted)
})

const onTagClick = async (tag: string) => {
  const uid = currentUserStore.firebaseUser?.uid
  if (uid == null) {
    snackbarMessage.value = 'ログインが必要です'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }
  try {
    const r = await toggleTagOnMyProfile(tag, currentUserStore.user?.user_tags)
    snackbarMessage.value = r === 'added' ? 'タグを取り入れました' : 'タグを外しました'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '更新に失敗しました'
    snackbarMessage.value = msg
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}
</script>

<template>
  <section v-if="sortedParticipantTags.length > 0" class="px-5 pb-4">
    <div class="text-subtitle-1 font-weight-bold mb-2">{{ $t('event_details.participant_tags_title') }}</div>
    <div class="d-flex flex-wrap align-center">
      <TagBadge
        v-for="row in sortedParticipantTags"
        :key="row.tag"
        :tag="row.tag"
        :count="row.count"
        :highlighted="isHighlighted(row.tag)"
        :clickable="true"
        @click="onTagClick(row.tag)"
      />
    </div>
    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top" timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </section>
</template>
