<script setup lang="ts">
import { getCommunityPath } from '@/router/utils'
import { useCommunityListStore } from '@shokujii/base/stores/communityList.js'
import { orderBy, where } from 'firebase/firestore'
import CommunityCard from '@shokujii/base/components/CommunityCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'

const communityListStore = useCommunityListStore([
  where('is_public', '==', true),
  where('is_approved', '==', true),
  where('subdomain_tags', 'array-contains', 'kanda-curry'),
  orderBy('community_num_members', 'desc'),
], 5)

const communities = computed(() => {
  return (
    communityListStore.communityStores?.flatMap((communityStore) =>
      communityStore.community == null ? [] : communityStore.community,
    ) ?? []
  )
})
</script>

<template>
  <v-row class="justify-center">
    <v-col v-for="community in communities" :key="community.community_id" md="10" sm="12" cols="12">
      <router-link :to="getCommunityPath(community.community_account)">
        <CommunityCard :community="community" :textLength="150" />
      </router-link>
    </v-col>
  </v-row>
  <v-row class="justify-center">
    <v-col cols="auto">
      <IncrementalLoader
        class="my-5"
        :total-count="communityListStore.totalCount ?? 0"
        :loaded-count="communities?.length ?? 0"
        @load="communityListStore.next()"
      />
    </v-col>
  </v-row>
</template>
