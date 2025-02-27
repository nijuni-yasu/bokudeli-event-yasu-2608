<script setup lang="ts">
definePage({
  meta: {
    navActiveLink: '/manage/event/',
  },
})
import { useEventStore, type EventStore } from '@/stores/event'
import { useI18n } from 'vue-i18n'
import { getEventPath } from '@/router/utils'
import { mdiArrowTopRight } from '@mdi/js'
import { useCommunityStore } from '@/stores/community'
import { getManageCommunityPath } from '@/router/utils'

const { t: $t } = useI18n()

const tabs = ['overview', 'member', /*'letter',*/ 'settings'] as const
type Tabs = (typeof tabs)[number]

const eventId = useRoute().params.eventId as string
const tabName = useRoute().params.tab as string
const eventStore = useEventStore(eventId) as EventStore
const event = computed(() => eventStore.event)

const tab = ref<Tabs>(tabs.find((t) => t === tabName) ?? tabs[0])

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
  component: defineAsyncComponent(() => import(`@/componentsLocal/manage/event/${tab}.vue`)),
}))
const openInNew = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <v-row v-if="community != null" class="py-2">
    <router-link :to="getManageCommunityPath(community.community_account)">
      <div class="text-h5 ml-3" style="display: flex; align-items: center; justify-content: flex-start; color:#1AC662">
        <v-img class="icon" cover :src="community.community_icon_image_url" style="flex-grow: 0; margin-right: 5px" />
      </div>
    </router-link>
      <v-btn
        class="px-0"
        variant="text"
        size="small"
        :to="getManageCommunityPath(community.community_account)"
      >
      {{ community?.community_name }} >
    </v-btn>
  </v-row>
  <v-row v-if="event != null">
    <v-col cols="12" class="py-0">
      <div class="text-h4" style="display: flex; align-items: center; justify-content: flex-start">
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
