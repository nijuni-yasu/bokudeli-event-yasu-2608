<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { User } from '@shokujii/common/schemas/User.js'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@shokujii/base/utils/buildSnsLinks'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import TagBadge from '@shokujii/base/components/TagBadge.vue'
import TagInput from '@shokujii/base/components/TagInput.vue'
import { mdiAlphaXCircle, mdiCogOutline, mdiFacebook, mdiInstagram, mdiTagOutline, mdiWeb } from '@mdi/js'
import { getProfile } from '@/router/utils'
import { toggleTagOnMyProfile, updateUserTags } from '@shokujii/base/apis/userTags.js'

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

const tagDialog = ref(false)
const draftTags = ref<string[]>([])

watch(tagDialog, (open) => {
  if (open) {
    draftTags.value = [...(props.userData.user_tags ?? [])]
  }
})

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const showSnack = (msg: string, color: 'success' | 'error') => {
  snackbarMessage.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

const saveTags = async () => {
  try {
    await updateUserTags(draftTags.value)
    tagDialog.value = false
    showSnack('タグを保存しました', 'success')
  } catch (e: unknown) {
    const err = e as { message?: string }
    showSnack(err?.message ?? '保存に失敗しました', 'error')
  }
}

const onTagClick = async (tag: string) => {
  if (isEditable.value) return
  const uid = currentUserStore.firebaseUser?.uid
  if (uid == null) {
    showSnack('ログインが必要です', 'error')
    return
  }
  try {
    const r = await toggleTagOnMyProfile(tag, currentUserStore.user?.user_tags)
    showSnack(r === 'added' ? 'タグを取り入れました' : 'タグを外しました', 'success')
  } catch (e: unknown) {
    const err = e as { message?: string }
    showSnack(err?.message ?? '更新に失敗しました', 'error')
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
              <v-btn :icon="mdiAlphaXCircle" class="ma-2"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
              <v-btn :icon="mdiFacebook" class="ma-2"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
              <v-btn :icon="mdiInstagram" class="ma-2"></v-btn>
            </a>
            <a v-if="websiteUrl" :href="websiteUrl" target="_blank">
              <v-btn :icon="mdiWeb" class="ma-2"></v-btn>
            </a>
          </v-col>
        </v-row>
        <v-card-text v-if="displayTags.length > 0 || isEditable" class="px-6">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-1 font-weight-medium">タグ</span>
            <v-btn
              v-if="isEditable"
              size="small"
              variant="tonal"
              :prepend-icon="mdiTagOutline"
              @click="tagDialog = true"
            >
              編集
            </v-btn>
          </div>
          <div class="d-flex flex-wrap">
            <TagBadge
              v-for="t in displayTags"
              :key="t"
              :tag="t"
              :highlighted="isHighlighted(t)"
              :clickable="!isEditable"
              @click="onTagClick(t)"
            />
            <span v-if="displayTags.length === 0 && isEditable" class="text-medium-emphasis text-body-2">未設定</span>
          </div>
        </v-card-text>
        <v-card-text
          v-linkify
          class="text-subtitle-1"
          :class="{ 'text-medium-emphasis': isDescriptionPlaceholder }"
          style="line-height: 30px; white-space: pre-line"
        >
          {{ userDescription }}
        </v-card-text>
        <v-card-actions v-if="isEditable" class="justify-center">
          <v-btn color="primary" class="mb-3" :prepend-icon="mdiCogOutline" :to="getProfile()">
            {{ $t('user_profile.profile_settings') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>

    <v-dialog v-model="tagDialog" max-width="640" scrollable>
      <v-card>
        <v-card-title>タグの編集</v-card-title>
        <v-card-text>
          <TagInput v-model="draftTags" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="tagDialog = false">キャンセル</v-btn>
          <v-btn color="primary" @click="saveTags">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top" timeout="4000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-row>
</template>

<style lang="scss" scoped></style>
