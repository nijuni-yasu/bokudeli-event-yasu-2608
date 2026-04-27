<script setup lang="ts">
definePage({
  meta: {
    navActiveLink: '/manage/community/',
  },
})
import { useCommunityStore } from '@shokujii/base/stores/community.js'
import { useI18n } from 'vue-i18n'
import { getCommunityPath } from '@/router/utils'
import { mdiArrowTopRight } from '@mdi/js'

const { t: $t } = useI18n()

const tabs = ['events', 'member', 'letter', 'album', 'invoice', 'slackSetting', 'settings'] as const
type Tabs = (typeof tabs)[number]

const communityAccount = useRoute().params.communityAccount as string
const tabName = useRoute().params.tab as string
const communityStore = useCommunityStore(communityAccount)
const community = computed(() => communityStore.community)

const tab = ref<Tabs>(tabs.find((t) => t === tabName) ?? tabs[0])

const components = tabs.map((tab) => ({
  value: tab,
  text: $t(`manage.community.tabs.${tab}`),
  component: defineAsyncComponent(() => import(`@/components/manage/community/${tab}.vue`)),
}))
const openInNew = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <v-container class="manage-container">
    <v-row v-if="community != null">
      <v-col cols="12">
        <div class="d-flex">
          <div class="icon-wrapper flex-shrink-0">
            <v-img class="icon" cover :src="communityStore.iconImageUrl" />
          </div>
          <div class="d-flex flex-column justify-center ms-3">
            <span class="text-h3">{{ community?.community_name }}</span>
            <v-btn
              class="mt-2 align-self-start"
              size="small"
              variant="outlined"
              :append-icon="mdiArrowTopRight"
              @click="openInNew(getCommunityPath(communityAccount))"
            >
              コミュニティページ
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-tabs v-model="tab">
          <v-tab v-for="c in components" :key="`tab_${c.value}`" :value="c.value" :to="`./${c.value}`">
            {{ c.text }}
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>
  </v-container>
  <v-container class="manage-container">
    <v-row>
      <v-col cols="12">
        <v-tabs-window v-model="tab">
          <v-tabs-window-item v-for="c in components" :key="`tabs-window_${c.value}`" :value="c.value">
            <component :is="c.component" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
.icon-wrapper {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 10%;
}

.icon {
  width: 100%;
  height: 100%;
}
</style>

<route lang="yaml">
meta:
  layout: manage
</route>
