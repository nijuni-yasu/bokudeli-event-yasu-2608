<script setup lang="ts">
import { computed } from 'vue'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@shokujii/base/utils/buildSnsLinks'
import { type BokudeliEventMember } from '@shokujii/base/stores/event.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import TagBadge from '@shokujii/base/components/TagBadge.vue'
import TagAddChip from '@shokujii/base/components/TagAddChip.vue'
import { getUserPath } from '@/router/utils'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useProfileTagToggle } from '@shokujii/base/composable/useTagImportHint.js'
import { orderTagsWithHighlightFirst } from '@shokujii/base/utils/tagDisplayOrder.js'
import { mdiAlphaXCircle, mdiFacebook, mdiInstagram, mdiWeb } from '@mdi/js'

const props = defineProps<{
  member: BokudeliEventMember
}>()

const currentUserStore = useCurrentUserStore()
const { toggleTag: onMemberTagClick } = useProfileTagToggle()
const myTags = computed(() => new Set(currentUserStore.user?.user_tags ?? []))
const isTagHighlighted = (tag: string) => myTags.value.has(tag)

const orderedUserTags = computed(() => orderTagsWithHighlightFirst(props.member.user_tags ?? [], isTagHighlighted))

const isCurrentUser = computed(() => props.member.user_id === currentUserStore.firebaseUser?.uid)

const showMemberTags = computed(() => (props.member.user_tags ?? []).length > 0 || isCurrentUser.value)

const userName = computed(() => props.member.user_name ?? 'ゲスト')
const twitterUrl = computed(() =>
  props.member.user_sns_twitter ? buildTwitterUrl(props.member.user_sns_twitter) : null,
)
const facebookUrl = computed(() =>
  props.member.user_sns_facebook ? buildFacebookUrl(props.member.user_sns_facebook) : null,
)
const instagramUrl = computed(() =>
  props.member.user_sns_instagram ? buildInstagramUrl(props.member.user_sns_instagram) : null,
)
const websiteUrl = computed(() => (props.member.user_sns_website ? props.member.user_sns_website : null))
const userDescription = computed(() => props.member.user_description ?? '')
const hasSnsLinks = computed(
  () => twitterUrl.value != null || facebookUrl.value != null || instagramUrl.value != null || websiteUrl.value != null,
)
</script>

<template>
  <router-link
    :to="getUserPath(member.user_id)"
    class="event-member-card-link d-flex flex-column h-100 w-100 pa-3 text-decoration-none"
  >
    <v-card class="d-flex flex-column h-100 w-100 pt-3 pb-0">
      <v-card-title class="d-flex align-center flex-column pb-0">
        <UserAvatar :user="member" :size="150" />
      </v-card-title>
      <v-card-text class="text-center py-1">
        <span class="text-h5 text-wrap">{{ userName }}</span>
      </v-card-text>
      <v-card-text v-if="hasSnsLinks" class="sns-buttons py-0">
        <v-row class="justify-center ma-0">
          <v-col cols="auto" class="pa-0">
            <a v-if="twitterUrl" :href="twitterUrl" target="_blank" rel="noopener noreferrer" @click.stop>
              <v-btn :icon="mdiAlphaXCircle" size="small" class="ma-2"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank" rel="noopener noreferrer" @click.stop>
              <v-btn :icon="mdiFacebook" size="small" class="ma-2"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank" rel="noopener noreferrer" @click.stop>
              <v-btn :icon="mdiInstagram" size="small" class="ma-2"></v-btn>
            </a>
            <a v-if="websiteUrl" :href="websiteUrl" target="_blank" rel="noopener noreferrer" @click.stop>
              <v-btn :icon="mdiWeb" size="small" class="ma-2"></v-btn>
            </a>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text v-if="showMemberTags" class="member-tags px-4 py-0">
        <div class="d-flex flex-wrap w-100" @click.stop.prevent>
          <TagBadge
            v-for="t in orderedUserTags"
            :key="t"
            :tag="t"
            compact
            :highlighted="isTagHighlighted(t)"
            :clickable="!isCurrentUser"
            @click="onMemberTagClick(t)"
          />
          <TagAddChip v-if="isCurrentUser" compact />
        </div>
      </v-card-text>
      <v-card-text v-if="userDescription" class="description-wrapper flex-grow-1 mt-auto">
        <div class="description">{{ userDescription }}</div>
      </v-card-text>
    </v-card>
  </router-link>
</template>

<style scoped lang="scss">
@import 'src/styles/variables/_vuetify.scss';

.event-member-card-link {
  color: inherit;
}

.sns-buttons {
  min-height: 48px;
}

.description-wrapper {
  min-height: 0;
  overflow: hidden;
}

.description {
  font-size: 12px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  /* autoprefixer: ignore next - line-clamp に必須 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: calc(1.7em * 3);
  word-break: break-word;
}
</style>
