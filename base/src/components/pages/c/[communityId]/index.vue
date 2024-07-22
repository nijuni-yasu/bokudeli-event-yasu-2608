<script setup lang="ts">
import { useRouter } from 'vue-router'
import { getEventPath, getEventCreatePath, getCommunitySettingsPath } from '@/router/utils'
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

const state = reactive({
  links: [] as string[],
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
            :to="getCommunitySettingsPath(communityStore.community.community_account)"
          >
            コミュニティ設定
          </v-btn>
          <v-chip v-if="communityStore.community.is_approved === false" color="primary" size="large"> 申請中 </v-chip>
        </v-row>
        <v-card flat class="align-center justify-center text-center my-8 pa-md-16 pa-sm-8 pa-xs-0">
          <v-row>
            <v-col>
              <VImg class="ma-0" aspect-ratio="1.91" cover :src="communityStore.community.community_cover_image_url" />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-card-title class="justify-center text-h4 pb-6">{{
                communityStore.community.community_name
              }}</v-card-title>
              <v-card-text v-linkify class="text-left text-subtitle-1 pb-6">
                {{ communityStore.community.community_desc }}
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>

        <!-- community event list -->
        <v-row>
          <!-- community description -->
          <v-col md="4" sm="6" cols="12">
            <v-card class="pa-5" color="text-center">
              <!-- community title and links -->
              <v-img
                style="border-radius: 10px"
                aspect-ratio="1"
                cover
                :src="communityStore.community.community_icon_image_url"
              />
              <v-card-title class="justify-center text-h5 py-5 pre-line">
                {{ communityStore.community.community_name }}
              </v-card-title>
              <v-card-text v-for="link in state.links" :key="link" class="text-left pb-3">
                <a v-if="link" :href="link" class="text-decoration-none" target="_blank">
                  {{ link }}
                </a>
              </v-card-text>
              <v-col>
                <v-btn
                  variant="outlined"
                  rounded="pill"
                  :prepend-icon="mdiEmail"
                  color="primary"
                  width="100%"
                  @click="openContactDialog"
                >
                  お問い合わせ
                </v-btn>
              </v-col>
              <v-col v-if="isManager">
                <v-btn variant="outlined" rounded color="primary" width="100%" @click="isOpenInvitationDailog = true">
                  管理者を招待する
                </v-btn>
              </v-col>
              <!-- community manager -->
              <div v-if="communityStore.members?.some((m) => m?.roles?.includes('manager') ?? false)">
                <v-card-title class="justify-center text-h6 font-weight-medium mt-10">Communicator</v-card-title>
                <div
                  v-for="manager in communityStore.members.filter(
                    (m) => m?.roles?.includes('manager') ?? false,
                  ) as CommunityMember[]"
                  :key="manager.user_id"
                >
                  <router-link :to="getUserPath(manager.user_id)">
                    <v-row>
                      <div class="d-flex flex-row px-6 py-2">
                        <UserAvatar :user="manager" :size="40" />
                        <div class="ma-2 text-subtitle-1">{{ manager.user_name }}</div>
                      </div>
                    </v-row>
                  </router-link>
                </div>
              </div>

              <!-- community member -->
              <div v-if="communityStore.members != null">
                <v-card-title class="justify-center text-h6 mt-7">Member</v-card-title>
                <div
                  v-for="member in communityStore.members.filter((m) => m != null) as CommunityMember[]"
                  :key="member.user_id"
                >
                  <router-link :to="getUserPath(member.user_id)">
                    <v-row>
                      <div class="d-flex flex-row px-6 py-2">
                        <UserAvatar :user="member" :size="40" />
                        <div class="ma-2 text-subtitle-1">{{ member.user_name }}</div>
                      </div>
                    </v-row>
                  </router-link>
                </div>
              </div>
            </v-card>
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
                  <v-card-title class="justify-center text-h6 pb-3 px-2">
                    {{ event.event_name }}
                  </v-card-title>
                  <v-card-text class="text-left pb-2 px-2">
                    【日時】{{ dateWithDayOfWeekString(event.event_start_datetime) }}〜{{
                      dateOnlyTimeString(event.event_end_datetime)
                    }}
                  </v-card-text>
                  <v-card-text class="text-left pb-2 px-2">
                    【期限】{{ dateWithDayOfWeekString(event.event_deadline_datetime) }}
                  </v-card-text>
                  <v-card-text class="text-left pb-2 px-2"> 【場所】{{ event.event_address }} </v-card-text>
                  <v-card-text class="text-left pb-2 px-2"> 【お店】 {{ event.shop_name }} </v-card-text>
                  <v-card-text class="text-left pb-5 px-2"> 【定員】{{ event.event_max_people }} 人 </v-card-text>
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
                    :to="{
                      path: getEventCreatePath(communityStore.community.community_account),
                      query: { id: event.event_id, step: 5 },
                    }"
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
                      path: getEventCreatePath(communityStore.community.community_account),
                      query: { id: event.event_id },
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
                      path: getEventCreatePath(communityStore.community.community_account),
                      query: { id: event.event_id, step: 4 },
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
