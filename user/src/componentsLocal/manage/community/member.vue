<script setup lang="ts">
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { useUserStore, type UserStore } from '@/stores/user'
import { getUserPath } from '@/router/utils'
import UserAvatar from '@/components/UserAvatar.vue'
import EmailDialog from '@/components/EmailDialog.vue'
import { mdiFacebook, mdiEmail } from '@mdi/js'
import XIcon from '@/icons/x'
import instagramIcon from '@/assets/images/sns/sns_instagram.png'
import type { CommunityMember } from '@/schemes/communityMember'
import { getAuth } from 'firebase/auth'
import { buildFacebookUrl, buildTwitterUrl, buildInstagramUrl } from '@/utils/buildSnsLinks'

const route = useRoute()
const communityAccount = route.params.communityAccount as string

const userStore = useUserStore(getAuth().currentUser!.uid) as UserStore
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const members = computed(
  () =>
    communityStore.members
      ?.flatMap((member) => member ?? [])
      ?.sort((a, b) => (a.roles?.includes('manager') ? -1 : b.roles?.includes('manager') ? 1 : 0)) ?? [],
)
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
const openNewLink = (url: string) => {
  window.open(url, '_blank')
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
              <td class="minimum-cell">
                <router-link :to="getUserPath(member.user_id)">
                  <UserAvatar :user="member"></UserAvatar>
                </router-link>
              </td>
              <td>
                <router-link :to="getUserPath(member.user_id)" style="color: rgba(var(--v-theme-on-surface))">
                  {{ member.user_name }}
                </router-link>
              </td>
              <td class="minimum-cell">
                <v-btn
                  :class="{ hidden: member.user_sns_facebook == null }"
                  :icon="mdiFacebook"
                  color="#1877F2"
                  density="compact"
                  variant="text"
                  @click="openNewLink(buildFacebookUrl(member.user_sns_facebook!))"
                />
              </td>
              <td class="minimum-cell">
                <v-btn
                  :class="{ hidden: member.user_sns_twitter == null }"
                  :icon="XIcon"
                  color="grey-900"
                  density="compact"
                  variant="text"
                  @click="openNewLink(buildTwitterUrl(member.user_sns_twitter!))"
                />
              </td>
              <td class="minimum-cell">
                <v-btn
                  :class="{ hidden: member.user_sns_instagram == null }"
                  density="compact"
                  variant="text"
                  icon=""
                  @click="openNewLink(buildInstagramUrl(member.user_sns_instagram!))"
                >
                  <img :src="instagramIcon" alt="Instagram" style="height: 24px; border-radius: 20%" />
                </v-btn>
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

<style scoped>
.hidden {
  visibility: hidden; /* サイズは保持されるが内容は非表示 */
}

.minimum-cell {
  width: 1px;
  padding: 0 !important;
}
</style>
