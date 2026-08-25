<script setup lang="ts">
import { computed } from 'vue'
import { getCommunityIconStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { convertStoragePathToURL } from '../utils/storage'
import { type BokudeliCommunity } from '../stores/community'

const props = defineProps<{
  community: BokudeliCommunity
}>()

const iconUrl = computed(() => convertStoragePathToURL(getCommunityIconStoragePath(props.community.community_id)))
</script>

<template>
  <v-card class="mx-2" color="text-center" elevation="3">
    <v-row>
      <v-col class="pa-0">
        <v-img :src="iconUrl" style="border-radius: 5px 5px 5px 5px" aspect-ratio="1" cover />
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
