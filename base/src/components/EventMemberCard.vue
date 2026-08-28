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
    <v-card class="event-member-card h-100 w-100 pt-3 pb-0">
      <v-card-title class="event-member-card__avatar d-flex align-center flex-column pb-0">
        <UserAvatar :user="member" :size="150" />
      </v-card-title>
      <v-card-text class="event-member-card__name text-center">
        <span class="event-member-card__name-text text-h5" :title="userName">{{ userName }}</span>
      </v-card-text>
      <v-card-text class="event-member-card__sns sns-buttons">
        <div v-if="hasSnsLinks" class="sns-buttons__row">
          <a v-if="twitterUrl" :href="twitterUrl" target="_blank" rel="noopener noreferrer" @click.stop>
            <v-btn :icon="mdiAlphaXCircle" size="x-small" class="sns-buttons__btn" />
          </a>
          <a v-if="facebookUrl" :href="facebookUrl" target="_blank" rel="noopener noreferrer" @click.stop>
            <v-btn :icon="mdiFacebook" size="x-small" class="sns-buttons__btn" />
          </a>
          <a v-if="instagramUrl" :href="instagramUrl" target="_blank" rel="noopener noreferrer" @click.stop>
            <v-btn :icon="mdiInstagram" size="x-small" class="sns-buttons__btn" />
          </a>
          <a v-if="websiteUrl" :href="websiteUrl" target="_blank" rel="noopener noreferrer" @click.stop>
            <v-btn :icon="mdiWeb" size="x-small" class="sns-buttons__btn" />
          </a>
        </div>
      </v-card-text>
      <v-card-text class="event-member-card__description description-wrapper">
        <div v-if="userDescription !== ''" class="description">{{ userDescription }}</div>
      </v-card-text>
      <v-card-text class="event-member-card__tags member-tags px-4 py-2">
        <div v-if="showMemberTags" class="d-flex flex-wrap w-100" @click.stop.prevent>
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
    </v-card>
  </router-link>
</template>

<style scoped lang="scss">
@import 'src/styles/variables/_vuetify.scss';

.event-member-card-link {
  color: inherit;
}

.event-member-card {
  display: flex;
  flex-direction: column;
}

.event-member-card__avatar,
.event-member-card__name,
.event-member-card__sns,
.event-member-card__description,
.event-member-card__tags {
  flex-shrink: 0;
}

$event-member-card-inline-padding: 16px;
$event-member-card-zone-gap: 8px;

.event-member-card__name {
  box-sizing: border-box;
  height: calc(2rem + #{$event-member-card-zone-gap * 2});
  min-height: calc(2rem + #{$event-member-card-zone-gap * 2});
  padding: $event-member-card-zone-gap $event-member-card-inline-padding !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-member-card__name-text {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  /* autoprefixer: ignore next - line-clamp に必須 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.sns-buttons {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  min-height: 48px;
  padding: $event-member-card-zone-gap $event-member-card-inline-padding !important;
}

.sns-buttons__row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.sns-buttons__btn {
  margin: 0 !important;
}

.description-wrapper {
  height: calc(1.7em * 3);
  min-height: calc(1.7em * 3);
  padding: $event-member-card-zone-gap $event-member-card-inline-padding !important;
  overflow: hidden;
}

.member-tags {
  // compact TagBadge: 20px + margin-bottom 4px → 2行分で開始位置を同行揃え
  min-height: 48px;
}

.description {
  font-size: 12px;
  line-height: 1.7;
  text-align: start;
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
