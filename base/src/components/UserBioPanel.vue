<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { User } from '@shokujii/common/schemas/User.js'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@shokujii/base/utils/buildSnsLinks'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import TagBadge from '@shokujii/base/components/TagBadge.vue'
import TagAddChip from '@shokujii/base/components/TagAddChip.vue'
import { mdiAlphaXCircle, mdiCogOutline, mdiFacebook, mdiInstagram, mdiWeb } from '@mdi/js'
import { getProfile } from '@/router/utils'
import { toggleTagOnMyProfile } from '@shokujii/base/apis/userTags.js'
import { useNotification } from '@shokujii/base/composable/notification.js'

const { t: $t } = useI18n()

const props = withDefaults(
  defineProps<{
    userData: User
    isEditable: boolean | undefined
    hideSns?: boolean
  }>(),
  {
    hideSns: false,
  },
)

const currentUserStore = useCurrentUserStore()
const notification = useNotification()

const isEditable = computed(() => props.isEditable ?? false)

const userName = computed(() => props.userData.user_name ?? 'ゲスト')

const isDescriptionPlaceholder = computed(
  () => props.userData.user_description === '' && currentUserStore.firebaseUser?.uid === props.userData.user_id,
)

const userDescription = computed(() => {
  if (props.userData.user_description !== '') return props.userData.user_description
  return isDescriptionPlaceholder.value ? $t('user_profile.user_description_placeholder') : ''
})
const twitterUrl = computed(() =>
  props.userData.user_sns_twitter === '' ? undefined : buildTwitterUrl(props.userData.user_sns_twitter),
)

const facebookUrl = computed(() =>
  props.userData.user_sns_facebook === '' ? undefined : buildFacebookUrl(props.userData.user_sns_facebook),
)

const instagramUrl = computed(() =>
  props.userData.user_sns_instagram === '' ? undefined : buildInstagramUrl(props.userData.user_sns_instagram),
)

const websiteUrl = computed(() =>
  props.userData.user_sns_website === '' ? undefined : props.userData.user_sns_website,
)

const displayTags = computed(() => props.userData.user_tags ?? [])

const myTags = computed(() => new Set(currentUserStore.user?.user_tags ?? []))
const isHighlighted = (tag: string) => myTags.value.has(tag)

const onTagClick = async (tag: string) => {
  if (isEditable.value) return
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
  <v-row class="user-bio-panel">
    <!-- user profile -->
    <v-col cols="12">
      <v-card class="pt-8 mx-4 mx-sm-0">
        <v-card-title class="d-flex align-center flex-column mb-4">
          <UserAvatar :user="userData" :size="180" />
        </v-card-title>
        <v-card-text>
          <div class="text-h4 text-center">{{ userName }}</div>
        </v-card-text>
        <v-row v-if="!hideSns" class="justify-center">
          <v-col cols="auto">
            <a v-if="twitterUrl" :href="twitterUrl" target="_blank">
              <v-btn :icon="mdiAlphaXCircle" size="small" class="ma-1"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
              <v-btn :icon="mdiFacebook" size="small" class="ma-1"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
              <v-btn :icon="mdiInstagram" size="small" class="ma-1"></v-btn>
            </a>
            <a v-if="websiteUrl" :href="websiteUrl" target="_blank">
              <v-btn :icon="mdiWeb" size="small" class="ma-1"></v-btn>
            </a>
          </v-col>
        </v-row>
        <v-card-text
          v-linkify
          class="text-subtitle-1"
          :class="{ 'text-medium-emphasis': isDescriptionPlaceholder }"
          style="line-height: 30px; white-space: pre-line"
        >
          {{ userDescription }}
        </v-card-text>
        <v-card-text v-if="displayTags.length > 0 || isEditable" class="px-6 pt-0">
          <div class="d-flex flex-wrap">
            <TagBadge
              v-for="t in displayTags"
              :key="t"
              :tag="t"
              :highlighted="isHighlighted(t)"
              :clickable="!isEditable"
              @click="onTagClick(t)"
            />
            <TagAddChip v-if="isEditable" />
          </div>
        </v-card-text>
        <v-card-actions v-if="isEditable" class="justify-center">
          <v-btn color="primary" class="mb-3" :prepend-icon="mdiCogOutline" :to="getProfile()">
            {{ $t('user_profile.profile_settings') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
