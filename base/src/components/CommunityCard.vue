<script setup lang="ts">
import UserAvatar from './UserAvatar.vue'
import { convertTruncateText } from '../schemes/converter'
import type BokudeliCommunity from '../schemes/bokudeliCommunity'
import type { CommunityMember } from '../schemes/communityMember'

defineProps<{
  community: BokudeliCommunity
  members?: CommunityMember[]
  textLength: number
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
        <v-card-title class="text-h5 text-left py-3">
          {{ community.community_name }}
        </v-card-title>
        <v-card-text class="text-left pb-3">
          {{ convertTruncateText(community.community_desc, textLength) }}
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
