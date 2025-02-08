<script setup lang="ts">
import { getManageCommunityPath, getManageNewCommunityPath } from '@/router/utils'
import { useCommunityListStore } from '@/stores/communityList'
import { doc, orderBy, where } from 'firebase/firestore'
import CommunityCard from '@/components/CommunityCard.vue'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import { mdiPlus, mdiHelp } from '@mdi/js'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

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

const isOpenNewCommunityDialog = ref(false)

watch(communities, (communities) => {
  const isReady =
    communityListStore.communityStores?.every(
      (communityStore) =>
        communityStore.community != null &&
        communityStore.members != null &&
        communityStore.members.length !== 0 &&
        communityStore.members.every((member) => member?.roles != null),
    ) ?? false
  if (
    isReady &&
    communityListStore.totalCount === communityListStore.communityStores?.length &&
    communities.length === 0
  ) {
    isOpenNewCommunityDialog.value = true
  }
})
</script>

<template>
  <v-row class="justify-center">
    <v-col md="10" sm="12" cols="12">
      <v-row class="pa-3 align-center">
        <v-btn
          class="mr-2"
          variant="outlined"
          size="large"
          :prepend-icon="mdiPlus"
          @click="router.push(getManageNewCommunityPath())"
        >
          {{ $t('manage.new_community') }}
        </v-btn>
        <v-btn variant="outlined" size="small" :icon="mdiHelp" @click="isOpenNewCommunityDialog = true" />
      </v-row>
      <v-row v-show="communityListStore.totalCount === communityListStore.communityStores?.length && communities.length === 0" class="mt-5">
        <v-col class="text-h5">
          <div v-html="$t('manage.event.no_community')" />
        </v-col>
      </v-row>
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
  <div>
    <confirm-dialog v-model="isOpenNewCommunityDialog" :ok-text="'OK'" max-width="800px">
      <v-card-text class="text-center my-2 text-h4">
        {{ $t('community_new_modal.community.title') }}
      </v-card-text>
      <v-card-text class="text-subtitle" style="line-height: 1.6rem">
        <div v-html="$t('community_new_modal.community.desc')" />
      </v-card-text>
    </confirm-dialog>
  </div>
</template>

<route lang="yaml">
meta:
  layout: manage
</route>
