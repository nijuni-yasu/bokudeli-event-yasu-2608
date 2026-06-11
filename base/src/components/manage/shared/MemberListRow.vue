<script setup lang="ts">
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import MemberSnsButtons from '@shokujii/base/components/manage/MemberSnsButtons.vue'
import type { User } from '@shokujii/common/schemas/User'

defineProps<{
  member: User
  userPath: string
}>()
</script>

<template>
  <td class="minimum-cell">
    <router-link :to="userPath">
      <UserAvatar :user="member" />
    </router-link>
  </td>
  <td class="name-cell">
    <router-link :to="userPath" style="color: rgba(var(--v-theme-on-surface))">
      {{ member.user_name }}
    </router-link>
  </td>
  <MemberSnsButtons
    :user-sns-facebook="member.user_sns_facebook"
    :user-sns-twitter="member.user_sns_twitter"
    :user-sns-instagram="member.user_sns_instagram"
  />
  <td>
    <v-spacer />
  </td>
  <slot name="actions" />
</template>

<style scoped>
.name-cell {
  width: 300px;
}
.minimum-cell {
  width: 1px;
  padding: 0 !important;
}
</style>
