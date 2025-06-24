<script setup lang="ts">
import type BokudeliCommunity from '../schemes/bokudeliCommunity'

defineProps<{
  community: BokudeliCommunity
}>()

</script>

<template>
  <v-card class="mx-2" color="text-center" elevation="3">
    <v-row>
      <v-col class="pa-0">
        <v-img
          v-if="community.community_icon_image_url != null"
          :src="community.community_icon_image_url"
          style="border-radius: 5px 5px 5px 5px"
          aspect-ratio="1"
          cover
        />
      </v-col>
    </v-row>
  </v-card>
  <v-row>
    <v-col class="d-flex flex-column">
      <v-card-title class="text-h5 text-center text-truncate">
        {{ community.community_name }}
      </v-card-title>
    </v-col>
  </v-row>  
</template>
