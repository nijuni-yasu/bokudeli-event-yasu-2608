<script setup lang="ts">
import UserAvatar from './UserAvatar.vue'
import type { BokudeliCommunity, BokudeliCommunityMember } from '../stores/community'

defineProps<{
  community: BokudeliCommunity
  members?: (BokudeliCommunityMember | null)[]
}>()
</script>

<template>
  <v-card class="ma-1" color="text-center">
    <v-row>
      <v-col md="6" sm="12" cols="12" class="pa-0">
        <v-img
          v-if="community.community_cover_image_url != null"
          :src="community.community_cover_image_url"
          style="border-radius: 5px 0px 0px 5px"
          aspect-ratio="1.91"
          cover
        />
        <div v-else>hoge</div>
      </v-col>
      <v-col md="6" sm="12" cols="12" class="d-flex flex-column">
        <!-- title -->
        <v-card-title class="text-h4 font-weight-black text-left py-5">
          {{ community.community_name }}
        </v-card-title>
        <v-card-text class="community-card__desc-outer text-left pb-3">
          <div class="community-card__desc">{{ community.community_desc }}</div>
        </v-card-text>
        <v-spacer />
        <!-- Mutual members -->
        <v-card-text v-if="members != null" class="mt-auto">
          <div class="mb-2">
            <span class="text--primary font-weight-medium"> {{ members.length }} members </span>
          </div>
          <div class="v-avatar-group">
            <UserAvatar
              v-for="(member, i) in members.slice(0, 19) ?? []"
              :key="member?.user_id ?? `${community.community_name}_avatar_${i}`"
              :user="member"
              :size="40"
            />
          </div>
        </v-card-text>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped lang="scss">
/* flex 子で line-clamp が効くよう min-height を緩める */
.community-card__desc-outer {
  min-height: 0;
}

/* 説明文: 5行で切り捨て（末尾 …）。v-card-text 直下ではなく内側 div に指定（Vuetify と display の競合を避ける） */
.community-card__desc {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  /* autoprefixer: ignore next - line-clamp に必須 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: 0;
}
</style>
