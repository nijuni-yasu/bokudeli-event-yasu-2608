<script setup lang="ts">
import { db } from '@/firebase'
import { doc, orderBy, where } from 'firebase/firestore'
import { getCommunityCreatePath } from '@/router/utils'
import { useCommunityListStore } from '@/stores/communityList'
import { getAuth } from 'firebase/auth'
import { getEventCreatePath } from '@/router/utils'
import LoginDialog from '@/components/LoginDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { mdiPlus } from '@mdi/js'

const router = useRouter()
const userId = getAuth().currentUser?.uid
const isLoginConfirmDialogOpened = ref(false)
const isLoginDialogOpened = ref(false)
const loadingElement = ref()
let observer: IntersectionObserver
let isVisible = true

const communityListStore =
  userId == null
    ? null
    : useCommunityListStore(
        [where('members', 'array-contains', doc(db, 'users', userId)), orderBy('community_num_members', 'desc')],
        10,
      )

const communityList = computed(
  () =>
    communityListStore?.communityStores?.flatMap((communityStore) => {
      if (communityStore.members?.some((m) => m?.user_id === userId && m?.roles?.includes('manager')) === true) {
        return communityStore.community ?? []
      } else {
        return []
      }
    }) ?? [],
)

const hasMore = computed(() => {
  if (communityListStore == null) {
    return false
  }
  if (communityListStore.totalCount == null || communityListStore.communityStores?.length == null) {
    return true
  }
  return communityListStore.communityStores.length < communityListStore.totalCount
})

const createCommunity = () => {
  if (userId == null) {
    isLoginConfirmDialogOpened.value = true
  } else {
    router.push(getCommunityCreatePath())
  }
}

watch(
  () => communityListStore?.communityStores,
  () => {
    if (isVisible) {
      communityListStore?.next()
    }
  },
)

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible = true
          communityListStore?.next()
        } else {
          isVisible = false
        }
      })
    },
    {
      // オプションでroot、rootMargin、thresholdを設定可能
      threshold: 0.1, // 10%の部分が見えたらトリガー
    },
  )

  if (loadingElement.value?.$el != null) {
    observer.observe(loadingElement.value.$el)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" sm="12" md="7" class="pa-1">
      <v-card class="text-center ma-md-10 pa-md-10">
        <v-card-title class="text-h5 mt-5 font-weight-bold"> イベント作成 </v-card-title>
        <v-card-text class="my-3 pa-0 text-caption text-md-body-2">
          イベントを作成するコミュニティを選択してください。<br />
          コミュニティがない場合は新規作成してください。<br />
          イベントとコミュニティは無料で作成いただけます。
        </v-card-text>

        <v-col>
          <v-divider class="my-2" />
          <div v-for="community of communityList" :key="community.community_account">
            <router-link :to="getEventCreatePath(community.community_account)">
              <v-row class="ma-2">
                <div class="ma-2" style="width: 50px; height: 50px">
                  <v-img
                    :src="community.community_icon_image_url"
                    style="border-radius: 5px 5px 5px 5px"
                    cover
                    aspect-ratio="1"
                  />
                </div>
                <div class="ma-3 text-body-1 text-md-h6 text-left align-self-center">
                  {{ community.community_name }}
                </div>
              </v-row>
            </router-link>
            <v-divider class="my-2" />
          </div>
          <div v-if="hasMore">
            <v-row class="ma-2 justify-center">
              <v-progress-circular ref="loadingElement" indeterminate color="primary"></v-progress-circular>
            </v-row>
          </div>
        </v-col>
        <v-row class="ma-2 text-center justify-center">
          <v-btn
            class="ma-3 text-h6 text-sm-body-1 text-center justify-center"
            variant="text"
            color="primary"
            :prepend-icon="mdiPlus"
            @click="createCommunity"
          >
            コミュニティを新規作成する
          </v-btn>
        </v-row>
      </v-card>
    </v-col>
    <confirm-dialog
      v-model="isLoginConfirmDialogOpened"
      :is-confirm="false"
      @click="(isLoginDialogOpened = true), (isLoginConfirmDialogOpened = false)"
    >
      ログインしてください
    </confirm-dialog>
    <login-dialog v-model="isLoginDialogOpened" />
  </v-row>
</template>
<style lang="scss" scoped></style>
