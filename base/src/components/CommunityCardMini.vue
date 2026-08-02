<script setup lang="ts">
import { useAppCommunityStore } from '@shokujii/base/composable/useAppCommunityStore.js'
import { type BokudeliCommunity } from '../stores/community'

const props = defineProps<{
  community: BokudeliCommunity
}>()
const communityStore = useAppCommunityStore(props.community)
</script>

<template>
  <v-card class="mx-2" color="text-center" elevation="3">
    <v-row>
      <v-col class="pa-0">
        <v-img :src="communityStore.iconImageUrl" style="border-radius: 5px 5px 5px 5px" aspect-ratio="1" cover />
      </v-col>
    </v-row>
  </v-card>
  <v-row>
    <v-col class="d-flex flex-column">
      <v-card-title class="text-h6 text-center text-truncate">
        {{ community.community_name }}
      </v-card-title>
    </v-col>
  </v-row>
</template>
