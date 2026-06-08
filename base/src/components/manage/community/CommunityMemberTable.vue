<script setup lang="ts">
import {
  useCommunityStore,
  type BokudeliCommunityMember,
  type CommunityStore,
} from '@shokujii/base/stores/community.js'
import { useUserStore, type UserStore } from '@shokujii/base/stores/user.js'
import EmailDialog from '@shokujii/base/components/EmailDialog.vue'
import MemberListRow from '@shokujii/base/components/manage/shared/MemberListRow.vue'
import ManagerInvitationDialog from '@shokujii/base/components/manage/community/ManagerInvitationDialog.vue'
import ManagerRoleChangeDialog from '@shokujii/base/components/manage/community/ManagerRoleChangeDialog.vue'
import MemberEmailNotSetDialog from '@shokujii/base/components/manage/MemberEmailNotSetDialog.vue'
import { useManageMemberEmail } from '@shokujii/base/composable/useManageMemberEmail.js'
import { buildCommunityMemberCsv, downloadMemberCsv } from '@shokujii/base/composable/memberCsvExport.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { getAuth } from 'firebase/auth'
import { mdiDownload, mdiAccountPlusOutline, mdiAccountRemoveOutline, mdiLink, mdiEmailOutline } from '@mdi/js'
import type {
  UserPathResolver,
  ManageCommunitySettingsPathResolver,
} from '@shokujii/base/composable/managePathResolvers.js'

const props = defineProps<{
  communityAccount: string
  getUserPath: UserPathResolver
  getManageCommunitySettingsPath: ManageCommunitySettingsPathResolver
}>()

const emit = defineEmits<{
  'manager-self-removed': []
}>()

const { t: $t } = useI18n()
const notification = useNotification()

const userStore = useUserStore(getAuth().currentUser!.uid) as UserStore
const communityStore = useCommunityStore(props.communityAccount) as CommunityStore

const members = computed(
  () =>
    communityStore.members
      ?.flatMap((member) => member ?? [])
      ?.sort((a, b) => (a.roles?.includes('manager') ? -1 : b.roles?.includes('manager') ? 1 : 0)) ?? [],
)
const currentUserId = computed(() => userStore.user?.user_id)
const managerCount = computed(() => members.value.filter((member) => member.roles?.includes('manager')).length)
const communityId = computed(() => communityStore.community?.community_id)

const {
  canSendEmail,
  targetMember: emailTargetMember,
  isEmailDialogOpen,
  isOpenEmailSetupDialog,
  clickEmailButton,
  goToCommunitySettings,
  onEmailSent,
  onEmailFailed,
} = useManageMemberEmail({
  communityAccount: computed(() => props.communityAccount),
  communityEmail: computed(() => communityStore.community?.community_email),
  getManageCommunitySettingsPath: (account) => props.getManageCommunitySettingsPath(account),
})

const addTargetMember = ref<BokudeliCommunityMember | null>(null)
const removeTargetMember = ref<BokudeliCommunityMember | null>(null)
const isLoading = ref(false)
const isInvitationDialogOpen = ref(false)

const clearRoleDialog = () => {
  addTargetMember.value = null
  removeTargetMember.value = null
}

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
  if (member.user_id === currentUserId.value && managerCount.value <= 1) {
    notification.show($t('manage.member.remove_manager_dialog.last_manager_error'), 'error')
    return
  }

  isLoading.value = true
  try {
    await communityStore.removeRole(member.user_id, 'manager')
    notification.show($t('manage.member.remove_manager_dialog.notification'), 'success')
    if (member.user_id === currentUserId.value) {
      emit('manager-self-removed')
    }
  } catch (error) {
    console.error(error)
    notification.show($t('manage.member.remove_manager_dialog.error'), 'error')
  } finally {
    removeTargetMember.value = null
    isLoading.value = false
  }
}

const downloadCsvFile = () => {
  downloadMemberCsv('community_member.csv', buildCommunityMemberCsv(members.value))
}
</script>

<template>
  <v-container class="manage-container">
    <v-row class="justify-center">
      <v-col md="12" sm="12" cols="12" class="d-flex justify-end ga-2">
        <v-btn
          variant="outlined"
          :prepend-icon="mdiLink"
          :disabled="communityId == null"
          @click="isInvitationDialogOpen = true"
        >
          {{ $t('manage.member.invite_manager') }}
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
                    <MemberListRow :member="member" :user-path="getUserPath(member.user_id)">
                      <template #actions>
                        <td class="text-right role-cell text-body-2">
                          {{
                            member.roles?.includes('manager') ? $t('manage.member.manager') : $t('manage.member.member')
                          }}
                        </td>
                        <td class="text-center number-cell">
                          <template v-if="member.roles?.includes('manager')">
                            <v-btn
                              v-if="member.user_id !== currentUserId || managerCount > 1"
                              :icon="mdiAccountRemoveOutline"
                              size="small"
                              variant="text"
                              color="grey-500"
                              @click="removeTargetMember = member"
                            />
                          </template>
                          <template v-else-if="member.user_id !== currentUserId">
                            <v-btn
                              :icon="mdiAccountPlusOutline"
                              size="small"
                              variant="text"
                              @click="addTargetMember = member"
                            />
                          </template>
                        </td>
                        <td class="text-center number-cell">
                          <v-btn
                            :icon="mdiEmailOutline"
                            variant="text"
                            size="small"
                            :color="canSendEmail ? undefined : 'grey-400'"
                            @click="clickEmailButton(member)"
                          />
                        </td>
                      </template>
                    </MemberListRow>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <EmailDialog
    v-if="emailTargetMember != null"
    v-model="isEmailDialogOpen"
    :toUser="emailTargetMember"
    :communityAccount="communityAccount"
    :communityId="communityStore.community?.community_id ?? ''"
    :replyTo="communityStore.community?.community_email ?? ''"
    @sent="onEmailSent"
    @failed="onEmailFailed"
  />
  <MemberEmailNotSetDialog v-model="isOpenEmailSetupDialog" :ok-click="goToCommunitySettings" />
  <ManagerRoleChangeDialog
    :add-target-member="addTargetMember"
    :remove-target-member="removeTargetMember"
    :is-loading="isLoading"
    :current-user-id="currentUserId"
    @confirm-add="addAccount"
    @confirm-remove="removeAccount"
    @cancel="clearRoleDialog"
  />
  <ManagerInvitationDialog v-model="isInvitationDialogOpen" :community-id="communityId" />
</template>

<style scoped>
.number-cell {
  width: 60px;
}
.role-cell {
  min-width: 5em;
  white-space: nowrap;
}
</style>
