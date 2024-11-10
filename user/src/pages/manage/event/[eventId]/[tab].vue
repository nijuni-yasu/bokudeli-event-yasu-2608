<script setup lang="ts">
definePage({
  meta: {
    navActiveLink: '/manage/event/',
  },
})
import { useEventStore, type EventStore } from '@/stores/event'
import { useI18n } from 'vue-i18n'
import { getEventPath } from '@/router/utils'
import { mdiOpenInNew } from '@mdi/js'

const { t: $t } = useI18n()

const tabs = ['settings', 'member', 'letter'] as const
type Tabs = (typeof tabs)[number]

const eventId = useRoute().params.eventId as string
const tabName = useRoute().params.tab as string
const eventStore = useEventStore(eventId) as EventStore
const event = computed(() => eventStore.event)

const tab = ref<Tabs>(tabs.find((t) => t === tabName) ?? tabs[0])

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
  <v-row v-if="event != null">
    <v-col cols="12">
      <div style="display: flex; align-items: center; justify-content: flex-start">
        {{ event.event_name }}
        <v-btn
          variant="plain"
          :icon="mdiOpenInNew"
          @click="openInNew(getEventPath(event.community_account, eventId))"
        />
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
  height: 128px;
  aspect-ratio: 1/1;
}
</style>

<route lang="yaml">
meta:
  layout: manage
</route>
