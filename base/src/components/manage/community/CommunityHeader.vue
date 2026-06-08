<script setup lang="ts">
import { mdiArrowTopRight } from '@mdi/js'

defineProps<{
  communityName: string
  iconImageUrl: string | undefined
  communityPath: string
}>()

const openInNew = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <div class="d-flex">
        <div class="icon-wrapper flex-shrink-0">
          <v-img class="icon" cover :src="iconImageUrl" />
        </div>
        <div class="d-flex flex-column justify-center ms-3">
          <span class="text-h3">{{ communityName }}</span>
          <v-btn
            class="mt-2 align-self-start"
            size="small"
            variant="outlined"
            :append-icon="mdiArrowTopRight"
            @click="openInNew(communityPath)"
          >
            {{ $t('manage.community.public_page') }}
          </v-btn>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
.icon-wrapper {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 10%;
}

.icon {
  width: 100%;
  height: 100%;
}
</style>
