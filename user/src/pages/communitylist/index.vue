<script setup lang="ts">
import { getCommunityPath } from '@/router/utils'
import { useCommunitiesStore, type CommunitiesStore } from '@/stores/community'
import { orderBy, where } from 'firebase/firestore'
import CommunityCard from '@/components/CommunityCard.vue'
import IncrementalLoader from '@/components/IncrementalLoader.vue'

const communitiesStore = useCommunitiesStore([
  where('is_public', '==', true),
  where('is_approved', '==', true),
  orderBy('community_num_members', 'desc'),
]) as CommunitiesStore
communitiesStore.setPageSize(5)

const communities = computed(() => {
  return (
    communitiesStore.communityStores?.flatMap((communityStore) =>
      communityStore.community == null ? [] : communityStore.community,
    ) ?? []
  )
})
</script>

<template>
  <v-row class="justify-center">
    <v-col v-for="community in communities" :key="community.community_id" md="10" sm="12" cols="12">
      <router-link :to="getCommunityPath(community.community_account)">
        <CommunityCard :community="community" />
      </router-link>
    </v-col>
  </v-row>
  <v-row class="justify-center">
    <v-col cols="auto">
      <IncrementalLoader
        class="my-5"
        :total-count="communitiesStore.totalCount ?? 0"
        :loaded-count="communities?.length ?? 0"
        @load="communitiesStore.next()"
      />
    </v-col>
  </v-row>
</template>
