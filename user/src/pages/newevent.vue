<script setup lang="ts">
import { db } from '@/firebase'
import { doc, orderBy, where } from 'firebase/firestore'
import { getCommunityCreatePath } from '@/router/utils'
import { type CommunitiesStore, useCommunitiesStore } from '@/stores/community'
import { getAuth } from 'firebase/auth'
import { getEventCreatePath } from '@/router/utils'
import LoginDialog from '@/components/LoginDialog.vue'

const router = useRouter()
const userId = getAuth().currentUser?.uid
const isLoginDialogOpened = ref(false)

if (userId == null) {
  isLoginDialogOpened.value = true
}
const communitiesStore = (userId == null) ? null : useCommunitiesStore([
  where('members', 'array-contains', doc(db, 'users', userId)),
  orderBy('community_num_members', 'desc'),
]) as CommunitiesStore
communitiesStore?.setPageSize(null)

const communities = computed(() => communitiesStore?.communityStores?.flatMap(
  (communityStore) => {
    if (communityStore.members?.some(m => m?.roles?.includes('manager')) === true) {
      return communityStore.community ?? []
    } else {
      return []
    }
  }
) ?? [])
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" sm="12" md="6">
      <v-card class="text-center ma-md-10 pa-md-10">
        <v-card-title class="text-h5 my-3 font-weight-bold">
          イベント作成
        </v-card-title>
        <v-card-text class="my-3">
          イベントを作成するコミュニティを選択してください。<br>
          またはコミュニティを新規作成することもできます。
        </v-card-text>

        <v-divider class="my-2" />
        <div v-for="community of communities" :key="community.community_account">
          <router-link :to="getEventCreatePath(community.community_account)">
            <v-row class="ma-2">
              <div class="ma-2" style="width: 50px; height: 50px;">
                <v-img
                  :src="community.community_icon_image_url"
                  style="border-radius: 5px 5px 5px 5px"
                  cover
                />
              </div>
              <div class="ma-3 text-h6 text-left align-self-center">
                {{ community.community_name }}
              </div>
            </v-row>
          </router-link>
          <v-divider class="my-2" />
        </div>
        <v-row class="ma-2 text-center justify-center">
          <v-btn
            class="ma-3 text-h6 text-center justify-center"
            variant="text"
            color="primary"
            prepend-icon="mdi-plus"
            @click="router.push(getCommunityCreatePath())"
          >
            コミュニティを新規作成する
          </v-btn>
        </v-row>
      </v-card>
    </v-col>
    <login-dialog v-model="isLoginDialogOpened" />
  </v-row>
</template>
<style lang="scss" scoped></style>
