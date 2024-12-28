<script setup lang="ts">
definePage({
  meta: {
    navActiveLink: '/manage/community/',
  },
})
import { useCommunityStore } from '@/stores/community'
import { useI18n } from 'vue-i18n'
import { getCommunityPath } from '@/router/utils'
import { mdiOpenInNew } from '@mdi/js'

const { t: $t } = useI18n()

const tabs = ['events', 'member', 'letter', 'settings'] as const
type Tabs = (typeof tabs)[number]

const communityAccount = useRoute().params.communityAccount as string
const tabName = useRoute().params.tab as string
const communityStore = useCommunityStore(communityAccount)
const community = computed(() => communityStore.community)

const tab = ref<Tabs>(tabs.find((t) => t === tabName) ?? tabs[0])

const components = tabs.map((tab) => ({
  value: tab,
  text: $t(`manage.community.tabs.${tab}`),
  component: defineAsyncComponent(() => import(`@/componentsLocal/manage/community/${tab}.vue`)),
}))
const openInNew = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <v-row v-if="community != null">
    <v-col cols="12">
      <div class="text-h3" style="display: flex; align-items: center; justify-content: flex-start">
        <v-img class="icon" cover :src="community.community_icon_image_url" style="flex-grow: 0; margin-right: 20px" />
        {{ community?.community_name }}
        <v-btn variant="plain" :icon="mdiOpenInNew" @click="openInNew(getCommunityPath(communityAccount))" />
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
  height: 100px;
  aspect-ratio: 1/1;
  border-radius: 10%;
}
</style>

<route lang="yaml">
meta:
  layout: manage
</route>
