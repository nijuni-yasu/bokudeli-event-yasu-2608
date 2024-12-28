<script setup lang="ts">
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { useUserStore, type UserStore } from '@/stores/user'
import { getUserPath } from '@/router/utils'
import UserAvatar from '@/components/UserAvatar.vue'
import EmailDialog from '@/components/EmailDialog.vue'
import { mdiEmail } from '@mdi/js'
import type { CommunityMember } from '@/schemes/communityMember'
import { getAuth } from 'firebase/auth'

const route = useRoute()
const router = useRouter()
const communityAccount = route.params.communityAccount as string

const userStore = useUserStore(getAuth().currentUser!.uid) as UserStore
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const members = computed(() => communityStore.members?.flatMap((member) => member ?? []) ?? [])
const canSendEmail = computed(() => !isEmpty(userStore.user?.user_email))

const targetMember = ref<CommunityMember | null>(null)
const isEmailDialogOpen = computed({
  get: () => targetMember.value != null,
  set: (val) => {
    if (!val) {
      targetMember.value = null
    }
  },
})
const clickContact = (member: CommunityMember) => {
  targetMember.value = member
}
</script>

<template>
  <v-container>
    <v-row class="justify-center">
      <v-col md="10" sm="10" cols="12">
        <v-table>
          <tbody>
            <tr v-for="(member, i) of members" :key="member.user_id">
              <td>{{ i + 1 }}</td>
              <!-- RouterLink はレイアウトを壊してしまうので @click でリンク指定する -->
              <td
                style="display: flex; align-items: center; gap: 12px; cursor: pointer"
                @click="router.push(getUserPath(member.user_id))"
              >
                <UserAvatar :user="member" style="height: 80%"></UserAvatar>
                {{ member.user_name }}
              </td>
              <td>
                {{ member.roles?.includes('manager') ? $t('manage.member.manager') : $t('manage.member.member') }}
              </td>
              <td>
                <v-btn
                  v-if="canSendEmail && !isEmpty(member.user_email) && member.user_id !== userStore.user?.user_id"
                  :icon="mdiEmail"
                  variant="text"
                  @click="clickContact(member)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-container>
  <EmailDialog v-if="targetMember != null" v-model="isEmailDialogOpen" :toUser="targetMember" />
</template>
