<script setup lang="ts">
import { db } from '@/firebase'
import { getEventCreatePath, getManageEventPath } from '@/router/utils'
import { useCommunityStore } from '@/stores/community'
import { useCommunityListStore, type CommunityListStore } from '@/stores/communityList'
import { getAuth } from 'firebase/auth'
import { doc, orderBy, where } from 'firebase/firestore'
import { mdiMenuDown, mdiPlus, mdiHelp } from '@mdi/js'
import { useEventListStore } from '@/stores/eventList'
import { useDisplay } from 'vuetify'
import EventCard from '@/components/EventCard.vue'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const display = useDisplay()

const numOfColumns = computed(() => {
  switch (display.name.value) {
    case 'xs':
      return 1
    case 'sm':
      return 2
    default:
      return 3
  }
})

const userId = getAuth().currentUser!.uid
const communityListStore = useCommunityListStore(
  [where('managers', 'array-contains', doc(db, 'users', userId)), orderBy('community_num_members', 'desc')],
  5,
) as CommunityListStore

const communityList = computed(() => {
  if (communityListStore.communityStores == null) {
    return null
  }
  if (communityListStore.communityStores.length !== communityListStore.totalCount) {
    communityListStore.next()
  }
  return communityListStore.communityStores.flatMap((communityStore) => communityStore.community ?? [])
})

const communityAccount = ref<string | null>(communityList.value?.[0]?.community_account ?? null)
const communityAccountForList = computed({
  get: () => [communityAccount.value],
  set: (value) => {
    communityAccount.value = value[0]
  },
})

watch(communityList, (list) => {
  if (communityAccount.value == null && list != null && list.length > 0) {
    communityAccount.value = list[0].community_account
  }
})
const community = computed(() =>
  communityAccount.value == null ? null : useCommunityStore(communityAccount.value).community,
)

const eventListStore = computed(() =>
  useEventListStore(
    [where('community_account', '==', communityAccount.value), orderBy('event_start_datetime', 'desc')],
    numOfColumns.value,
  ),
)

const events = computed(
  () =>
    eventListStore.value.eventStores?.flatMap((s) => {
      if (s.event == null) {
        return []
      }
      return { event: s.event, members: s.members ?? [] }
    }) ?? [],
)
const isOpenEventDialog = ref(false)

</script>

<template>
  <v-row v-if="communityListStore.totalCount === 0">
    <v-col cols="12" class="text-h5 ml-15">
      <div v-html="$t('manage.event.no_community')" />
    </v-col>
  </v-row>
  <v-row v-if="communityAccount != null">
    <v-col cols="12" class="buttons">
      <v-menu v-if="community != null && communityList != null">
        <template #activator="{ props }">
          <v-btn v-bind="props">
            <span>{{ community.community_name }}</span>
            <v-icon :icon="mdiMenuDown" />
          </v-btn>
        </template>
        <v-list v-model:selected="communityAccountForList" :mandatory="true" active-class="active">
          <v-list-item v-for="item in communityList" :key="item.community_id" :value="item.community_account">
            <v-list-item-title>{{ item.community_name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn variant="outlined" :prepend-icon="mdiPlus" @click="router.push(getEventCreatePath(communityAccount))">{{
        $t('manage.new_event')
      }}</v-btn>
      <v-btn variant="outlined" size="small" :icon="mdiHelp" @click="isOpenEventDialog = true" />
    </v-col>
  </v-row>
  <v-row v-if="communityAccount != null && eventListStore.totalCount === 0">
    <v-col cols="12" class="text-h5">
      <div v-html="$t('manage.event.no_events')" />
    </v-col>
  </v-row>
  <v-row class="mb-2">
    <v-col
      v-for="{ event, members } in events"
      :key="`popular_${event.event_id}`"
      md="3"
      sm="6"
      cols="12"
      class="content"
    >
      <router-link :to="getManageEventPath(event.event_id)">
        <EventCard class="event-card" :event="event" :members="members" />
      </router-link>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" class="text-center">
      <IncrementalLoader
        :total-count="eventListStore.totalCount ?? Infinity"
        :loaded-count="eventListStore.eventStores?.length ?? 0"
        @load="eventListStore.next"
      />
    </v-col>
  </v-row>
  <confirm-dialog v-model="isOpenEventDialog" :ok-text="'OK'" max-width="800px">
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('event_create_modal.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('event_create_modal.desc')" />
    </v-card-text>
  </confirm-dialog>
</template>

<style lang="scss" scoped>
.event-card {
  height: 100%;
  width: 100%;
}

.buttons {
  display: flex;
  gap: 16px;
}
</style>

<route lang="yaml">
meta:
  layout: manage
</route>
