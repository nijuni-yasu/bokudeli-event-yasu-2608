<script setup lang="ts">
import { computed } from 'vue'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@shokujii/base/utils/buildSnsLinks'
import { type BokudeliEventMember } from '@shokujii/base/stores/event.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import TagBadge from '@shokujii/base/components/TagBadge.vue'
import { getUserPath } from '@/router/utils'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { toggleTagOnMyProfile } from '@shokujii/base/apis/userTags.js'
import { orderTagsWithHighlightFirst } from '@shokujii/base/utils/tagDisplayOrder.js'
import { mdiAlphaXCircle, mdiFacebook, mdiInstagram, mdiWeb } from '@mdi/js'

const props = defineProps<{
  member: BokudeliEventMember
}>()

const currentUserStore = useCurrentUserStore()
const myTags = computed(() => new Set(currentUserStore.user?.user_tags ?? []))
const isTagHighlighted = (tag: string) => myTags.value.has(tag)

const orderedUserTags = computed(() => orderTagsWithHighlightFirst(props.member.user_tags ?? [], isTagHighlighted))

const onMemberTagClick = async (tag: string) => {
  const uid = currentUserStore.firebaseUser?.uid
  if (uid == null) return
  try {
    await toggleTagOnMyProfile(tag, currentUserStore.user?.user_tags)
  } catch {
    void 0
  }
}

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
</script>

<template>
  <v-container class="pa-3">
    <router-link :to="getUserPath(member.user_id)">
      <v-card class="pt-3 pb-0">
        <v-card-title class="d-flex align-center flex-column">
          <UserAvatar :user="member" :size="150" />
          <v-row class="justify-center">
            <v-col class="mt-1">
              <span class="text-h5 text-center text-wrap">{{ userName }}</span>
            </v-col>
          </v-row>
        </v-card-title>
        <v-card-text v-if="orderedUserTags.length > 0" class="px-4 py-0">
          <div class="d-flex flex-wrap justify-center" @click.stop.prevent>
            <TagBadge
              v-for="t in orderedUserTags"
              :key="t"
              :tag="t"
              :highlighted="isTagHighlighted(t)"
              :clickable="true"
              @click="onMemberTagClick(t)"
            />
          </div>
        </v-card-text>
        <v-card-text class="description">
          {{ userDescription }}
        </v-card-text>
        <v-card-text class="sns-buttons">
          <v-row class="justify-center">
            <v-col cols="auto">
              <a v-if="twitterUrl" :href="twitterUrl" target="_blank" @click.stop>
                <v-btn :icon="mdiAlphaXCircle" size="small" class="ma-2"></v-btn>
              </a>
              <a v-if="facebookUrl" :href="facebookUrl" target="_blank" @click.stop>
                <v-btn :icon="mdiFacebook" size="small" class="ma-2"></v-btn>
              </a>
              <a v-if="instagramUrl" :href="instagramUrl" target="_blank" @click.stop>
                <v-btn :icon="mdiInstagram" size="small" class="ma-2"></v-btn>
              </a>
              <a v-if="websiteUrl" :href="websiteUrl" target="_blank" @click.stop>
                <v-btn :icon="mdiWeb" size="small" class="ma-2"></v-btn>
              </a>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </router-link>
  </v-container>
</template>

<style scoped lang="scss">
@import 'src/styles/variables/_vuetify.scss';

.sns-buttons {
  height: 75px;
}
.description {
  font-size: 12px;
  line-height: 1.7;
  height: calc(1.7em * 2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
</style>
