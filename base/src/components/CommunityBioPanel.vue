<script setup lang="ts">
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { type CommunityMember } from '@/schemes/communityMember'
import { getUserPath } from '@/router/utils'
import UserAvatar from '@/components/UserAvatar.vue'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@/composable/buildSnsLinks'
import { mdiEmail, mdiLink, mdiAlphaXCircle, mdiFacebook, mdiInstagram, mdiWeb } from '@mdi/js'

const props = defineProps<{
  community: BokudeliCommunity
  members: (CommunityMember | null)[] | null
  isManager: boolean
}>()
const emit = defineEmits<{
  (e: 'clickContact'): void
  (e: 'clickInvitation'): void
}>()

const state = reactive({
  links: [] as string[],
})

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

</script>

<template>
  <v-card class="pa-5" color="text-center">
    <!-- community title and links -->
    <v-img style="border-radius: 10px" aspect-ratio="1" cover :src="community.community_icon_image_url" />
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
        お問い合わせ
      </v-btn>
    </v-col>
    <v-col v-if="props.isManager">
      <v-btn
        variant="outlined"
        rounded="pill"
        size="small"
        color="primary"
        width="100%"
        :prepend-icon="mdiLink"
        @click="emit('clickInvitation')"
      >
        管理者を招待する
      </v-btn>
    </v-col>
    <!-- community manager -->
    <div v-if="members?.some((m) => m?.roles?.includes('manager') ?? false)">
      <v-card-title class="justify-center text-h6 font-weight-medium mt-10">Communicator</v-card-title>
      <div
        v-for="manager in members.filter((m) => m?.roles?.includes('manager') ?? false) as CommunityMember[]"
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
    <div v-if="members != null">
      <v-card-title class="justify-center text-h6 mt-7">Member</v-card-title>
      <div v-for="member in members.filter((m) => m != null) as CommunityMember[]" :key="member.user_id">
        <router-link :to="getUserPath(member.user_id)">
          <v-row>
            <div class="d-flex flex-row px-6 py-2">
              <UserAvatar :user="member" :size="40" />
              <div class="ma-2 text-subtitle-1">{{ member.user_name }}</div>
            </div>
          </v-row>
        </router-link>
      </div>
    </div>
  </v-card>
</template>

<style lang="scss" scoped></style>
