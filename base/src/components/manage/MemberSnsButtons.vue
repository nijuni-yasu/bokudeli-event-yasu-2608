<script setup lang="ts">
import { mdiFacebook } from '@mdi/js'
import XIcon from '@shokujii/base/icons/x.js'
import instagramIcon from '@shokujii/base/assets/images/sns/sns_instagram.png'
import { buildFacebookUrl, buildTwitterUrl, buildInstagramUrl } from '@shokujii/base/utils/buildSnsLinks.js'

const props = defineProps<{
  userSnsFacebook: string
  userSnsTwitter: string
  userSnsInstagram: string
}>()

const openNewLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <td class="minimum-cell">
    <v-btn
      v-if="props.userSnsFacebook !== ''"
      :icon="mdiFacebook"
      color="#1877F2"
      density="compact"
      variant="text"
      @click="openNewLink(buildFacebookUrl(props.userSnsFacebook))"
    />
  </td>
  <td class="minimum-cell">
    <v-btn
      v-if="props.userSnsTwitter !== ''"
      :icon="XIcon"
      color="grey-900"
      density="compact"
      variant="text"
      @click="openNewLink(buildTwitterUrl(props.userSnsTwitter))"
    />
  </td>
  <td class="minimum-cell">
    <v-btn
      v-if="props.userSnsInstagram !== ''"
      density="compact"
      variant="text"
      :icon="true"
      @click="openNewLink(buildInstagramUrl(props.userSnsInstagram))"
    >
      <img :src="instagramIcon" alt="Instagram" style="height: 24px; border-radius: 20%" />
    </v-btn>
  </td>
</template>

<style scoped>
.minimum-cell {
  width: 1px;
  padding: 0 !important;
}
</style>
