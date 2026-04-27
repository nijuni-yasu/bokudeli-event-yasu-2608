<script setup lang="ts">
definePage({
  meta: {
    navActiveLink: '/manage/event/',
  },
})
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import { useI18n } from 'vue-i18n'
import { getEventPath } from '@/router/utils'
import { mdiArrowTopRight } from '@mdi/js'
import { useCommunityStore } from '@shokujii/base/stores/community.js'
import { getManageCommunityPath } from '@/router/utils'
import { injectionKeyEventEditHostActive } from '@shokujii/base/components/eventcreate/symbols.js'

const { t: $t } = useI18n()

const tabs = ['overview', 'member', 'letter', 'flyer', 'settings'] as const
type Tabs = (typeof tabs)[number]

const eventId = useRoute().params.eventId as string
const tabName = useRoute().params.tab as string
const eventStore = useEventStore(eventId) as EventStore
const event = computed(() => eventStore.event)

const tab = ref<Tabs>(tabs.find((t) => t === tabName) ?? tabs[0])

// settings タブが表示中のときだけ EventEditStepNav (Teleport で body 直下) を表示させるためのフラグ。
// VWindowItem は非アクティブ項目を v-show でマウントしたまま隠すため、Teleport 経由の DOM だけが
// 祖先の display:none の影響を受けず残ってしまう。これを inject 経由で StepNav 側に伝えて抑制する。
const isSettingsTabActive = computed(() => tab.value === 'settings')
provide(injectionKeyEventEditHostActive, isSettingsTabActive)

// コミュニティストアの取得
const communityStore = computed(() => {
  if (eventStore?.event?.community_account) {
    return useCommunityStore(eventStore.event.community_account)
  }
  return null
})
const community = computed(() => communityStore.value?.community)

const components = tabs.map((tab) => ({
  value: tab,
  text: $t(`manage.event.tabs.${tab}`),
  component: defineAsyncComponent(() => import(`@/components/manage/event/${tab}.vue`)),
}))
const openInNew = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <v-container class="manage-container">
    <v-row v-if="community != null" class="py-2">
      <router-link :to="getManageCommunityPath(community.community_account)">
        <div class="text-h5 ml-3 d-flex align-center justify-start text-primary">
          <v-img class="icon flex-shrink-0 me-2" cover :src="communityStore?.iconImageUrl" />
        </div>
      </router-link>
      <v-btn class="px-0" variant="text" size="small" :to="getManageCommunityPath(community.community_account)">
        {{ community?.community_name }} >
      </v-btn>
    </v-row>
    <v-row v-if="event != null">
      <v-col cols="12" class="py-0">
        <div class="text-h4 d-flex align-center justify-start">
          {{ event.event_name }}
          <v-btn
            class="ml-3"
            variant="outlined"
            size="small"
            :append-icon="mdiArrowTopRight"
            @click="openInNew(getEventPath(event.community_account, eventId))"
          >
            イベントページ
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
  </v-container>
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
  height: 30px;
  aspect-ratio: 1/1;
  border-radius: 10%;
}
</style>

<route lang="yaml">
meta:
  layout: manage
</route>
