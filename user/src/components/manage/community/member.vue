<script setup lang="ts">
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'
import { useUserStore, type UserStore } from '@shokujii/base/stores/user.js'
import { getUserPath } from '@/router/utils'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import EmailDialog from '@shokujii/base/components/EmailDialog.vue'
import { mdiFacebook, mdiDownload, mdiAccountPlusOutline, mdiAccountRemoveOutline, mdiLink } from '@mdi/js'
import XIcon from '@shokujii/base/icons/x.js'
import instagramIcon from '@/assets/images/sns/sns_instagram.png'
import type { BokudeliCommunityMember } from '@shokujii/base/stores/community.js'
import { getAuth } from 'firebase/auth'
import { buildFacebookUrl, buildTwitterUrl, buildInstagramUrl } from '@shokujii/base/utils/buildSnsLinks.js'
import { downloadCsv } from '@shokujii/base/utils/downloadCsv.js'
import { functions } from '@shokujii/base/firebase.js'
import { httpsCallable } from 'firebase/functions'
import { useNotification } from '@shokujii/base/composable/notification.js'

const route = useRoute()
const { t: $t } = useI18n()

const notification = useNotification()

const getInvitationUrlForCommunityManager = httpsCallable(functions, 'getInvitationUrlForCommunityManager')

const communityAccount = route.params.communityAccount as string

const userStore = useUserStore(getAuth().currentUser!.uid) as UserStore
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const members = computed(
  () =>
    communityStore.members
      ?.flatMap((member) => member ?? [])
      ?.sort((a, b) => (a.roles?.includes('manager') ? -1 : b.roles?.includes('manager') ? 1 : 0)) ?? [],
)
// const canSendEmail = computed(() => !isEmpty(userStore.user?.user_email))

const emailTargetMember = ref<BokudeliCommunityMember | null>(null)
const isEmailDialogOpen = computed({
  get: () => emailTargetMember.value != null,
  set: (val) => {
    if (!val) {
      emailTargetMember.value = null
    }
  },
})
const addTargetMember = ref<BokudeliCommunityMember | null>(null)
const removeTargetMember = ref<BokudeliCommunityMember | null>(null)
const isModifyAccountDialogOpen = computed({
  get: () => addTargetMember.value != null || removeTargetMember.value != null,
  set: (val) => {
    if (!val) {
      addTargetMember.value = null
      removeTargetMember.value = null
    }
  },
})
// const clickContact = (member: CommunityMember) => {
//   emailTargetMember.value = member
// }
const isLoading = ref(false)
const addAccount = async (member: BokudeliCommunityMember) => {
  isLoading.value = true
  try {
    await communityStore.addRole(member.user_id, 'manager')
    notification.show($t('manage.member.add_manager_dialog.notification'), 'success')
  } catch (error) {
    console.error(error)
    notification.show($t('manage.member.add_manager_dialog.error'), 'error')
  } finally {
    addTargetMember.value = null
    isLoading.value = false
  }
}
const removeAccount = async (member: BokudeliCommunityMember) => {
  isLoading.value = true
  try {
    await communityStore.removeRole(member.user_id, 'manager')
    notification.show($t('manage.member.remove_manager_dialog.notification'), 'success')
  } catch (error) {
    console.error(error)
    notification.show($t('manage.member.remove_manager_dialog.error'), 'error')
  } finally {
    removeTargetMember.value = null
    isLoading.value = false
  }
}
const isInvitationDialogOpen = ref(false)
const invitationUrl = ref('')
const inviteManager = async () => {
  isLoading.value = true
  try {
    const communityId = communityStore.community?.community_id
    const url = await getInvitationUrlForCommunityManager({ communityId })
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
        notification.show($t('copied_to_clipboard'), 'success')
      })
      .catch((err) => {
        // URL は表示されていて手動コピーは可能なのでメッセージは表示しない
        console.warn(err)
      })
  } catch (error) {
    console.error(error)
    notification.show($t('manage.community_manager_invitation.failed'), 'error')
  } finally {
    isLoading.value = false
  }
}
const openNewLink = (url: string) => {
  window.open(url, '_blank')
}
const downloadCsvFile = () => {
  let csv = '"UserName","X","Facebook","Instagram","UserProfile"\n'
  for (const member of members.value) {
    csv +=
      `"${member.user_name}",` +
      `"${member.user_sns_twitter !== '' ? buildTwitterUrl(member.user_sns_twitter!) : ''}",` +
      `"${member.user_sns_facebook !== '' ? buildFacebookUrl(member.user_sns_facebook!) : ''}",` +
      `"${member.user_sns_instagram !== '' ? buildInstagramUrl(member.user_sns_instagram!) : ''}",` +
      `"${member.user_description ?? ''}"\n`
  }
  downloadCsv('community_member.csv', csv)
}
</script>

<template>
  <v-container>
    <v-row class="justify-center">
      <v-col md="12" sm="12" cols="12" style="display: flex; justify-content: flex-end; gap: 10px">
        <v-btn variant="outlined" :prepend-icon="mdiLink" @click="isInvitationDialogOpen = true">
          管理者を招待する
        </v-btn>
        <v-btn variant="outlined" :prepend-icon="mdiDownload" @click="downloadCsvFile">
          {{ $t('manage.member.csv_download') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col md="12" sm="12" cols="12">
        <v-card class="pa-3 pa-md-12">
          <v-row class="justify-center">
            <v-col md="12" sm="12" cols="12">
              <v-table>
                <tbody>
                  <tr v-for="(member, i) of members" :key="member.user_id">
                    <td class="text-center text-body-2 number-cell">{{ i + 1 }}</td>
                    <td class="minimum-cell">
                      <router-link :to="getUserPath(member.user_id)">
                        <UserAvatar :user="member"></UserAvatar>
                      </router-link>
                    </td>
                    <td class="name-cell">
                      <router-link :to="getUserPath(member.user_id)" style="color: rgba(var(--v-theme-on-surface))">
                        {{ member.user_name }}
                      </router-link>
                    </td>
                    <td class="minimum-cell">
                      <v-btn
                        v-if="member.user_sns_facebook !== ''"
                        :icon="mdiFacebook"
                        color="#1877F2"
                        density="compact"
                        variant="text"
                        @click="openNewLink(buildFacebookUrl(member.user_sns_facebook!))"
                      />
                    </td>
                    <td class="minimum-cell">
                      <v-btn
                        v-if="member.user_sns_twitter !== ''"
                        :icon="XIcon"
                        color="grey-900"
                        density="compact"
                        variant="text"
                        @click="openNewLink(buildTwitterUrl(member.user_sns_twitter!))"
                      />
                    </td>
                    <td class="minimum-cell">
                      <v-btn
                        v-if="member.user_sns_instagram !== ''"
                        density="compact"
                        variant="text"
                        icon=""
                        @click="openNewLink(buildInstagramUrl(member.user_sns_instagram!))"
                      >
                        <img :src="instagramIcon" alt="Instagram" style="height: 24px; border-radius: 20%" />
                      </v-btn>
                    </td>
                    <td>
                      <v-spacer />
                    </td>
                    <td class="text-right role-cell text-body-2">
                      {{ member.roles?.includes('manager') ? $t('manage.member.manager') : $t('manage.member.member') }}
                    </td>
                    <td class="text-center number-cell">
                      <template v-if="member.user_id !== userStore.user?.user_id">
                        <v-btn
                          v-if="member.roles?.includes('manager')"
                          :icon="mdiAccountRemoveOutline"
                          size="small"
                          variant="text"
                          color="grey-500"
                          @click="removeTargetMember = member"
                        />
                        <v-btn
                          v-else
                          :icon="mdiAccountPlusOutline"
                          size="small"
                          variant="text"
                          @click="addTargetMember = member"
                        />
                      </template>
                    </td>
                    <!--
                    <td class="text-center">
                      <v-btn
                        v-if="canSendEmail && !isEmpty(member.user_email) && member.user_id !== userStore.user?.user_id"
                        :icon="mdiEmail"
                        variant="text"
                        @click="clickContact(member)"
                      />
                    </td>
                    -->
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <EmailDialog v-if="emailTargetMember != null" v-model="isEmailDialogOpen" :toUser="emailTargetMember" />
  <v-dialog v-model="isModifyAccountDialogOpen" persistent :width="$vuetify.display.smAndDown ? 'auto' : 650">
    <v-card v-if="addTargetMember != null" class="px-2 py-4">
      <v-card-title>
        {{ $t('manage.member.add_manager_dialog.title', [addTargetMember.user_name]) }}
      </v-card-title>
      <v-card-text>
        <div v-html="$t('manage.member.add_manager_dialog.description', [addTargetMember.user_name])" />
      </v-card-text>
      <v-card-actions>
        <v-btn type="cancel" :disabled="isLoading" @click="isModifyAccountDialogOpen = false">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn type="submit" :loading="isLoading" @click="addAccount(addTargetMember)">
          {{ $t('manage.member.add_manager_dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-card v-if="removeTargetMember != null" class="px-2 py-4">
      <v-card-title>
        {{ $t('manage.member.remove_manager_dialog.title', [removeTargetMember.user_name]) }}
      </v-card-title>
      <v-card-text>
        <div v-html="$t('manage.member.remove_manager_dialog.description', [removeTargetMember.user_name])" />
      </v-card-text>
      <v-card-actions>
        <v-btn type="cancel" :disabled="isLoading" @click="isModifyAccountDialogOpen = false">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn type="submit" :loading="isLoading" @click="removeAccount(removeTargetMember)">
          {{ $t('manage.member.remove_manager_dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="isInvitationDialogOpen" persistent :width="$vuetify.display.smAndDown ? 'auto' : 650">
    <v-card class="px-2 py-4">
      <v-card-title> {{ $t('manage.community_manager_invitation.title') }} </v-card-title>
      <v-card-text style="display: flex; flex-direction: column; gap: 20px; margin-top: 20px">
        <v-text-field
          v-model="invitationUrl"
          outlined
          dense
          :readonly="true"
          :label="$t('manage.community_manager_invitation.description')"
        />
        <v-btn color="primary" :loading="isLoading" @click="inviteManager">
          {{ $t('manage.community_manager_invitation.generate') }}
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <v-btn type="cancel" @click="isInvitationDialogOpen = false">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.hidden {
  visibility: hidden; /* サイズは保持されるが内容は非表示 */
}
.number-cell {
  width: 60px;
}
.name-cell {
  width: 300px;
}
.roll-cell {
  width: 60px;
}
.minimum-cell {
  width: 1px;
  padding: 0 !important;
}
</style>
