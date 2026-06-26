<script setup lang="ts">
import { getCommunityPath } from '@/router/utils'
import { useCommunityListStore } from '@shokujii/base/stores/communityList.js'
import { orderBy, where } from 'firebase/firestore'
import CommunityCard from '@shokujii/base/components/CommunityCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import { useEnterpriseId } from '@/composable/useEnterpriseId'

const { enterpriseId } = useEnterpriseId()
if (enterpriseId.value == null) {
  throw new Error('Enterprise is not resolved')
}

const communityListStore = computed(() =>
  useCommunityListStore(
    [
      where('enterprise_id', '==', enterpriseId.value),
      where('is_public', '==', true),
      where('is_approved', '==', true),
      orderBy('community_num_members', 'desc'),
    ],
    5,
  ),
)

const communities = computed(() => {
  return (
    communityListStore.value.communityStores?.flatMap((communityStore) =>
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
        :total-count="communityListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
        :loaded-count="communities?.length ?? 0"
        @load="communityListStore.next()"
      />
    </v-col>
  </v-row>
</template>
