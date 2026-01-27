<script setup lang="ts">
import { computed } from 'vue'
import type { BokudeliCommunity, BokudeliCommunityMember } from '@shokujii/base/stores/community.js'
import { getUserPath } from '@/router/utils'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@shokujii/base/utils/buildSnsLinks'
import { mdiEmail, mdiAlphaXCircle, mdiFacebook, mdiInstagram, mdiWeb, mdiCrown, mdiAccountGroup } from '@mdi/js'
import CommunityMembershipButton from '@shokujii/base/components/CommunityMembershipButton.vue'

const props = defineProps<{
  community: BokudeliCommunity
  members: (BokudeliCommunityMember | null | undefined)[] | null
}>()
const emit = defineEmits<{
  clickContact: []
}>()

const twitterUrl = computed(() =>
  props.community.community_sns_twitter ? buildTwitterUrl(props.community.community_sns_twitter) : undefined,
)

const facebookUrl = computed(() =>
  props.community.community_sns_facebook ? buildFacebookUrl(props.community.community_sns_facebook) : undefined,
)

const instagramUrl = computed(() =>
  props.community.community_sns_instagram ? buildInstagramUrl(props.community.community_sns_instagram) : undefined,
)

const officialSiteUrl = computed(() =>
  props.community.community_sns_officialsite ? props.community.community_sns_officialsite : undefined,
)
// コミュニティの設定によってはメンバー一覧を非表示にする
const isShowMember = computed(() =>
  props.community.is_show_member !== undefined ? props.community.is_show_member : true,
)

// managerではないメンバーのみをフィルタリング
const displayMembers = computed(() => props.members?.filter((m) => !m?.roles?.includes('manager')) ?? [])
</script>

<template>
  <v-card class="pa-5" color="text-center">
    <!-- community title and links -->
    <v-img style="border-radius: 10%" aspect-ratio="1" cover :src="community.community_icon_image_url" />
    <v-card-title class="justify-center text-h4 px-1 py-4 text-wrap">
      {{ community.community_name }}
    </v-card-title>
    <v-row class="justify-center pb-3">
      <v-col cols="auto">
        <a v-if="twitterUrl" :href="twitterUrl" target="_blank">
          <v-btn :icon="mdiAlphaXCircle" size="small" class="ma-2"></v-btn>
        </a>
        <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
          <v-btn :icon="mdiFacebook" size="small" class="ma-2"></v-btn>
        </a>
        <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
          <v-btn :icon="mdiInstagram" size="small" class="ma-2"></v-btn>
        </a>
        <a v-if="officialSiteUrl" :href="officialSiteUrl" target="_blank">
          <v-btn :icon="mdiWeb" size="small" class="ma-2"></v-btn>
        </a>
      </v-col>
    </v-row>
    <v-col>
      <v-btn
        variant="outlined"
        rounded="pill"
        size="small"
        color="primary"
        width="100%"
        :prepend-icon="mdiEmail"
        @click="emit('clickContact')"
      >
        {{ $t('community_bio_panel.contact') }}
      </v-btn>
    </v-col>
    <v-col class="pt-0">
      <community-membership-button
        v-if="community.community_account"
        :community-id="community.community_account"
        block
        :join-button-props="{ rounded: 'pill', size: 'small', 'prepend-icon': mdiAccountGroup }"
        :leave-button-props="{ variant: 'outlined', rounded: 'pill', size: 'small', 'prepend-icon': mdiAccountGroup }"
      />
    </v-col>
    <!-- community manager -->
    <div v-if="members?.some((m) => m?.roles?.includes('manager') ?? false)">
      <v-card-title class="justify-center text-h6 mt-7 d-flex align-center text-primary">
        <v-icon :icon="mdiCrown" size="22" class="mr-1" />
        {{ $t('community_bio_panel.manager') }}
      </v-card-title>
      <div
        v-for="manager in members.filter((m) => m?.roles?.includes('manager') ?? false) as BokudeliCommunityMember[]"
        :key="manager.user_id"
      >
        <router-link :to="getUserPath(manager.user_id)">
          <v-row>
            <div class="d-flex flex-row px-6 py-2">
              <UserAvatar :user="manager" :size="40" />
              <div class="ma-2 text-subtitle-1">{{ manager.user_name }}</div>
            </div>
          </v-row>
        </router-link>
      </div>
    </div>

    <!-- community member -->
    <!-- コミュニティの設定によってはメンバー一覧を非表示にする -->
    <div v-if="isShowMember === true && displayMembers.length > 0">
      <v-card-title class="justify-center text-h6 mt-7 d-flex align-center text-primary">
        <v-icon :icon="mdiAccountGroup" size="22" class="mr-1" />
        {{ $t('community_bio_panel.member') }}
      </v-card-title>
      <div v-for="(member, index) in displayMembers" :key="member?.user_id ?? `user-${index}`">
        <router-link v-if="member != null" :to="getUserPath(member.user_id)">
          <v-row>
            <div class="d-flex flex-row px-6 py-2">
              <UserAvatar :user="member" :size="40" />
              <div class="ma-2 text-subtitle-1">{{ member.user_name }}</div>
            </div>
          </v-row>
        </router-link>
        <!-- null の時はローディング中だが、undefined の時はユーザーが存在しない -->
        <v-row v-else-if="member === undefined">
          <div class="d-flex flex-row px-6 py-2">
            <UserAvatar :user="null" :size="40" />
          </div>
        </v-row>
      </div>
      <!-- 読み込み中のメンバーがいる場合はインジケーターを表示 -->
      <v-row v-if="displayMembers.some((m) => m === null)" class="justify-center">
        <div class="py-2">
          <v-progress-circular indeterminate color="primary" />
        </div>
      </v-row>
    </div>
  </v-card>
</template>

<style lang="scss" scoped></style>
