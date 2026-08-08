<script setup lang="ts">
definePage({
  meta: {
    navActiveLink: '/manage/community/',
  },
})
import { useCommunityStore } from '@shokujii/base/stores/community.js'
import CommunityHeader from '@shokujii/base/components/manage/community/CommunityHeader.vue'
import CommunityEventsPanel from '@shokujii/base/components/manage/community/CommunityEventsPanel.vue'
import CommunityMemberTable from '@shokujii/base/components/manage/community/CommunityMemberTable.vue'
import CommunityLetter from '@shokujii/base/components/manage/community/CommunityLetter.vue'
import CommunityAlbum from '@shokujii/base/components/manage/community/CommunityAlbum.vue'
import CommunityInvoice from '@shokujii/base/components/manage/community/CommunityInvoice.vue'
import CommunitySlackSetting from '@shokujii/base/components/manage/community/CommunitySlackSetting.vue'
import CommunitySettings from '@shokujii/base/components/manage/community/CommunitySettings.vue'
import {
  getCommunityPath,
  getEventCreatePath,
  getManageCommunitySettingsPath,
  getManageEventPath,
  getManagePath,
  getUserPath,
} from '@/router/utils'

const { t: $t } = useI18n()
const router = useRouter()

const tabs = ['events', 'member', 'letter', 'album', 'invoice', 'slackSetting', 'settings'] as const
type Tabs = (typeof tabs)[number]

const communityAccount = useRoute().params.communityAccount as string
const tabName = useRoute().params.tab as string
const communityStore = useCommunityStore(communityAccount)
const community = computed(() => communityStore.community)

const tab = ref<Tabs>(tabs.find((t) => t === tabName) ?? tabs[0])

const tabItems = tabs.map((value) => ({
  value,
  text: $t(`manage.community.tabs.${value}`),
}))

const onManagerSelfRemoved = () => {
  void router.replace({ path: getManagePath(), query: { refreshManaged: '1' } })
}
</script>

<template>
  <v-container class="manage-container">
    <CommunityHeader
      v-if="community != null"
      :community-name="community.community_name"
      :icon-image-url="communityStore.iconImageUrl"
      :community-path="getCommunityPath(communityAccount)"
    />
    <v-row>
      <v-col cols="12">
        <v-tabs v-model="tab">
          <v-tab v-for="c in tabItems" :key="`tab_${c.value}`" :value="c.value" :to="`./${c.value}`">
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
          <v-tabs-window-item value="events">
            <CommunityEventsPanel
              :community-account="communityAccount"
              :get-event-create-path="() => getEventCreatePath(communityAccount)"
              :get-manage-event-path="getManageEventPath"
            />
          </v-tabs-window-item>
          <v-tabs-window-item value="member">
            <CommunityMemberTable
              :community-account="communityAccount"
              :get-user-path="getUserPath"
              :get-manage-community-settings-path="getManageCommunitySettingsPath"
              @manager-self-removed="onManagerSelfRemoved"
            />
          </v-tabs-window-item>
          <v-tabs-window-item value="letter">
            <CommunityLetter />
          </v-tabs-window-item>
          <v-tabs-window-item value="album">
            <CommunityAlbum />
          </v-tabs-window-item>
          <v-tabs-window-item value="invoice">
            <CommunityInvoice :community-account="communityAccount" />
          </v-tabs-window-item>
          <v-tabs-window-item value="slackSetting">
            <CommunitySlackSetting />
          </v-tabs-window-item>
          <v-tabs-window-item value="settings">
            <CommunitySettings />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: manage
</route>
