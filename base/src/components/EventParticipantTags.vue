<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TagBadge from '@shokujii/base/components/TagBadge.vue'
import TagAddChip from '@shokujii/base/components/TagAddChip.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { toggleTagOnMyProfile } from '@shokujii/base/apis/userTags.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { sortTagCountRowsByHighlightThenCount } from '@shokujii/base/utils/tagDisplayOrder.js'
import { useNotification } from '@shokujii/base/composable/notification.js'

const props = withDefaults(
  defineProps<{
    event: BokudeliEvent
    maxVisibleTags?: number
    showEmptyHint?: boolean
    compact?: boolean
  }>(),
  {
    showEmptyHint: false,
    compact: false,
  },
)

const { t: $t } = useI18n()
const currentUserStore = useCurrentUserStore()
const notification = useNotification()

const myTags = computed(() => new Set(currentUserStore.user?.user_tags ?? []))

const isHighlighted = (tag: string) => myTags.value.has(tag)

const sortedParticipantTags = computed((): { tag: string; count: number }[] => {
  const m = props.event.event_members_tags
  if (m == null || Object.keys(m).length === 0) return []
  const rows = Object.entries(m).map(([tag, count]) => ({ tag, count }))
  return sortTagCountRowsByHighlightThenCount(rows, isHighlighted)
})

const visibleParticipantTags = computed(() => {
  if (props.maxVisibleTags == null) return sortedParticipantTags.value
  return sortedParticipantTags.value.slice(0, props.maxVisibleTags)
})

const isLoggedIn = computed(() => currentUserStore.firebaseUser != null)

const showEmptyHintMessage = computed(
  () =>
    props.showEmptyHint &&
    isLoggedIn.value &&
    (currentUserStore.user?.user_tags?.length ?? 0) === 0 &&
    sortedParticipantTags.value.length > 0,
)

const onTagClick = async (tag: string) => {
  const uid = currentUserStore.firebaseUser?.uid
  if (uid == null) {
    notification.show($t('event_details.tag_toggle_login_required'), 'error')
    return
  }
  try {
    const r = await toggleTagOnMyProfile(tag, currentUserStore.user?.user_tags)
    notification.show(
      r === 'added' ? $t('event_details.tag_toggle_added') : $t('event_details.tag_toggle_removed'),
      'success',
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : $t('event_details.tag_toggle_failed')
    notification.show(msg, 'error')
  }
}
</script>

<template>
  <section v-if="sortedParticipantTags.length > 0" :class="compact ? 'px-0 pb-2' : 'px-5 pb-4'">
    <div class="text-subtitle-1 font-weight-bold mb-2">{{ $t('event_details.participant_tags_title') }}</div>
    <p v-if="showEmptyHintMessage" class="text-body-2 text-medium-emphasis mb-2">
      {{ $t('user_tags.empty_hint') }}
    </p>
    <div class="d-flex flex-wrap align-center">
      <TagBadge
        v-for="row in visibleParticipantTags"
        :key="row.tag"
        :tag="row.tag"
        :count="row.count"
        :highlighted="isHighlighted(row.tag)"
        :clickable="true"
        :compact="compact"
        @click="onTagClick(row.tag)"
      />
      <TagAddChip :compact="compact" />
    </div>
  </section>
</template>
