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

const tabs = ['events', 'member', 'letter', 'invoice', 'slackSetting', 'settings'] as const
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
  <v-row v-if="community != null">
    <v-col cols="12">
      <div class="text-h3" style="display: flex; align-items: center; justify-content: flex-start">
        <v-img class="icon" cover :src="community.community_icon_image_url" style="flex-grow: 0; margin-right: 15px" />
        {{ community?.community_name }}
        <v-btn
          class="ml-3"
          size="small"
          variant="outlined"
          :append-icon="mdiArrowTopRight"
          @click="openInNew(getCommunityPath(communityAccount))"
        >
          コミュニティページ
        </v-btn>
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
  <v-row>
    <v-col cols="12">
      <v-tabs-window v-model="tab">
        <v-tabs-window-item v-for="c in components" :key="`tabs-window_${c.value}`" :value="c.value">
          <component :is="c.component" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
.icon {
  height: 75px;
  aspect-ratio: 1/1;
  border-radius: 10%;
}
</style>

<route lang="yaml">
meta:
  layout: manage
</route>
