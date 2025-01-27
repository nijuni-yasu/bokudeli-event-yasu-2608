<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  getEventPath,
  getEventEditShopNoticePath,
  getEventCreatePath,
  getManageCommunitySettingsPath,
  getEventEditPath,
} from '@/router/utils'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import CommunityContactDialog from '@/components/CommunityContactDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import UserAvatar from '@/components/UserAvatar.vue'
import { getUserPath } from '@/router/utils'
import { type CommunityMember } from '@/schemes/communityMember'
import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import { mdiPencilBoxOutline, mdiCog, mdiEmail } from '@mdi/js'
import CommunityBioPanel from '@/components/CommunityBioPanel.vue'

const get_invitaion_url_for_community_manager = httpsCallable(functions, 'get_invitaion_url_for_community_manager')

const props = defineProps<{
  communityId: string
}>()
const router = useRouter()

const communityStore = useCommunityStore(props.communityId) as CommunityStore

const isMember = ref(false)
const isManager = ref(false)
communityStore.getCurrentUserRoles().then((roles) => {
  isMember.value = roles != null
  isManager.value = roles?.includes('manager') ?? false
})

const events = computed(() => {
  // 読み込み中は null として扱う
  return communityStore.events?.flatMap((event) => {
    // 「コミュマネでない」かつ「参加受付中でない」場合は非表示
    if (
      isManager.value === false &&
      (event.event_status.value === 'in_draft' || event.event_status.value === 'applying_reservation')
    ) {
      return []
    }
    // 「コミュマネでもメンバーでもない」かつ「限定公開」の場合は非表示
    if (isManager.value === false && isMember.value === false && event.is_public === false) {
      return []
    }
    return event
  })
})

const goToEvents = (eventId: string) => {
  const path = getEventPath(props.communityId, eventId)
  router.push({ path })
}

const isOpenContactDialogVisible = ref(false)
const isOpenConfirmDialog = ref(false)
const isOpenLoginDialog = ref(false)
const isOpenInvitationDailog = ref(false)
const isOpenMessageDailog = ref(false)

const invitationUrl = ref('')
const message = ref('')
const isUrlLoading = ref(false)

// コミュニティへの問い合わせはログイン必須
const userStore = useStoreStoredUser()
const openContactDialog = () => {
  if (!userStore.storedUser) {
    isOpenConfirmDialog.value = true
  } else {
    isOpenContactDialogVisible.value = true
  }
}
const openLoginDialog = () => {
  isOpenLoginDialog.value = true
}
const inviteManager = async () => {
  isUrlLoading.value = true
  try {
    const communityId = communityStore.community?.community_id
    const url = await get_invitaion_url_for_community_manager({ communityId })
    invitationUrl.value = url.data as string
    // clipboard-write は 今の所 [Blink](https://www.chromium.org/blink/) のみ対応、かつ現時点ではなくても動作するのでコメントアウト
    // TODO ブラウザの対応状況を見て、適切に対応する
    // https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
    // https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1245#issuecomment-1522204068
    // const clipboardPermission = await navigator.permissions.query({ name: 'clipboard-write' })
    // if (clipboardPermission.state === 'granted' || clipboardPermission.state === 'prompt') {
    await navigator.clipboard
      .writeText(url.data as string)
      .then(() => {
        message.value = 'クリップボードにコピーしました'
        isOpenMessageDailog.value = true
      })
      .catch((err) => {
        // URL は表示されていて手動コピーは可能なのでメッセージは表示しない
        console.warn(err)
      })
  } catch (error) {
    console.error(error)
    message.value = 'URL の発行に失敗しました'
    isOpenMessageDailog.value = true
  } finally {
    isUrlLoading.value = false
  }
}
</script>
<template>
  <section>
    <v-row v-if="communityStore.community != null" class="justify-center">
      <!-- community main -->
      <v-col cols="12" md="9" sm="9">
        <v-row v-if="isManager" class="justify-end align-center mt-lg-5">
          <v-btn
            v-if="communityStore.community.is_approved"
            class="mx-2"
            color="white"
            elevation="5"
            rounded="pill"
            :prepend-icon="mdiPencilBoxOutline"
            :to="getEventCreatePath(communityStore.community.community_account)"
          >
            イベント新規作成
          </v-btn>
          <v-btn
            class="mx-2"
            color="white"
            elevation="5"
            rounded="pill"
            :prepend-icon="mdiCog"
            :to="getManageCommunitySettingsPath(communityStore.community.community_account)"
          >
            コミュニティ設定
          </v-btn>
          <v-chip v-if="communityStore.community.is_approved === false" color="primary" size="large"> 申請中 </v-chip>
        </v-row>
        <v-card flat class="align-center justify-center text-center my-8 pa-md-12 pa-sm-8 pa-xs-0">
          <v-row>
            <v-col>
              <VImg class="ma-0" aspect-ratio="1.91" cover :src="communityStore.community.community_cover_image_url" />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-card-title class="justify-center text-h3 pb-6 text-wrap">{{
                communityStore.community.community_name
              }}</v-card-title>
              <v-card-text v-linkify class="text-left pb-6">
                {{ communityStore.community.community_desc }}
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>

        <!-- community event list -->
        <v-row>
          <!-- community description -->
          <v-col md="4" sm="6" cols="12">
            <community-bio-panel
              :community="communityStore.community"
              :members="communityStore.members"
              :is-manager="isManager"
              @click-contact="openContactDialog"
              @click-invitation="() => (isOpenInvitationDailog = true)"
            />
          </v-col>
          <!-- events -->
          <v-col md="8" sm="6" cols="12">
            <v-row v-if="events != null">
              <v-col v-for="event in events" :key="event.event_id" md="6" sm="12" cols="12">
                <v-card class="mx-0" color="text-color cursor-pointer" @click="goToEvents(event.event_id)">
                  <v-img cover aspect-ratio="1.91" :src="event.event_cover_url" />
                  <v-chip class="mt-2 ml-2" size="small" color="primary" elevated flat>
                    {{ $t(`event_status.${event.event_status.value}`) }}
                  </v-chip>
                  <v-chip v-if="!event.is_public" class="mt-2 ml-2" size="small" color="primary" elevated flat>
                    {{ $t('private_event') }}
                  </v-chip>
                  <v-card-title class="justify-center text-h6 pb-3 px-2">
                    {{ event.event_name }}
                  </v-card-title>
                  <v-card-title class="text-left px-3 py-0 text-subtitle-2">
                    【日時】{{ dateWithDayOfWeekString(event.event_start_datetime) }}〜{{
                      dateOnlyTimeString(event.event_end_datetime)
                    }}
                  </v-card-title>
                  <v-card-title class="text-left px-3 py-0 text-subtitle-2">
                    【期限】{{ dateWithDayOfWeekString(event.event_deadline_datetime) }}
                  </v-card-title>
                  <v-card-title class="text-left px-3 py-0 text-subtitle-2">
                    【場所】{{ event.event_address }}
                  </v-card-title>
                  <v-card-title class="text-left px-3 py-0 text-subtitle-2">
                    【お店】 {{ event.shop_name }}
                  </v-card-title>
                  <v-card-title class="text-left px-3 pt-0 pb-3 text-subtitle-2">
                    【定員】{{ event.event_max_people }} 人
                  </v-card-title>
                </v-card>
                <v-row v-if="isManager" class="justify-end my-2 mr-1">
                  <v-btn
                    v-if="event.event_status.value === `in_draft`"
                    class="ml-1"
                    color="white"
                    elevation="5"
                    size="small"
                    rounded="pill"
                    :prepend-icon="mdiEmail"
                    :to="getEventEditShopNoticePath(event.event_id)"
                  >
                    予約
                  </v-btn>
                  <v-btn
                    v-if="event.event_status.value === 'in_draft'"
                    class="ml-1"
                    color="white"
                    elevation="5"
                    size="small"
                    rounded="pill"
                    :prepend-icon="mdiPencilBoxOutline"
                    :to="{
                      path: getEventEditPath(event.event_id),
                    }"
                  >
                    編集
                  </v-btn>
                  <v-btn
                    v-if="
                      event.event_status.value == 'applying_reservation' ||
                      event.event_status.value == 'accepting_order' ||
                      event.event_status.value == 'order_closed' ||
                      event.event_status.value === 'full'
                    "
                    class="ml-1"
                    color="white"
                    elevation="5"
                    size="small"
                    rounded="pill"
                    :prepend-icon="mdiPencilBoxOutline"
                    :to="{
                      path: getEventEditPath(event.event_id),
                    }"
                  >
                    編集
                  </v-btn>
                </v-row>
              </v-col>
            </v-row>
            <v-row v-else class="justify-center">
              <v-progress-circular indeterminate color="primary" />
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-progress-circular indeterminate color="primary" />
    </v-row>
    <community-contact-dialog
      v-if="communityStore.community"
      v-model="isOpenContactDialogVisible"
      :community-name="communityStore.community.community_name"
      :community-id="communityStore.community.community_id"
    />
    <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-click="openLoginDialog">
      ログインした後にお問い合わせしてください。
    </confirm-dialog>
    <login-dialog v-model="isOpenLoginDialog" />
    <confirm-dialog v-model="isOpenInvitationDailog" ok-text="閉じる">
      <div class="mt-4 mb-8">URL を発行して、追加するメンバーに権限を付与します<br /></div>
      <v-text-field
        v-model="invitationUrl"
        outlined
        dense
        :readonly="true"
        label="発行したURLは24時間有効で、利用されると無効になります。"
      />
      <v-btn class="mt-4" color="primary" :loading="isUrlLoading" @click="inviteManager">招待URLを発行</v-btn>
    </confirm-dialog>
    <confirm-dialog v-model="isOpenMessageDailog" :is-confirm="false">
      {{ message }}
    </confirm-dialog>
  </section>
</template>
<style lang="scss" scoped></style>
