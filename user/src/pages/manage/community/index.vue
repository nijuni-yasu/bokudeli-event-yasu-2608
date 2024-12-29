<script setup lang="ts">
import { getManageCommunityPath, getManageNewCommunityPath } from '@/router/utils'
import { useCommunityListStore } from '@/stores/communityList'
import { doc, orderBy, where } from 'firebase/firestore'
import CommunityCard from '@/components/CommunityCard.vue'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import { mdiPlus } from '@mdi/js'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase'

const router = useRouter()

const userId = getAuth().currentUser?.uid
if (userId == null) {
  throw new Error('User is not authenticated')
}

const communityListStore = useCommunityListStore(
  [where('members', 'array-contains', doc(db, 'users', userId)), orderBy('community_num_members', 'desc')],
  10,
)

const communities = computed(() => {
  return (
    communityListStore.communityStores?.flatMap((communityStore) => {
      if (communityStore.community == null || communityStore.members == null) {
        return []
      }
      return communityStore.members.some((member) => member?.user_id === userId && member?.roles?.includes('manager'))
        ? communityStore.community
        : []
    }) ?? []
  )
})
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-btn variant="outlined" :prepend-icon="mdiPlus" @click="router.push(getManageNewCommunityPath())">
        {{ $t('manage.new_community') }}
      </v-btn>
    </v-col>
  </v-row>
  <v-row class="justify-center">
    <v-col v-for="community in communities" :key="community.community_id" md="10" sm="12" cols="12">
      <router-link :to="getManageCommunityPath(community.community_account)">
        <CommunityCard :community="community" :text-length="150" />
      </router-link>
    </v-col>
  </v-row>
  <v-row class="justify-center">
    <v-col cols="auto">
      <IncrementalLoader
        class="my-5"
        :total-count="communityListStore.totalCount ?? Infinity"
        :loaded-count="communityListStore.communityStores?.length ?? 0"
        @load="communityListStore.next()"
      />
    </v-col>
  </v-row>
</template>

<route lang="yaml">
meta:
  layout: manage
</route>
