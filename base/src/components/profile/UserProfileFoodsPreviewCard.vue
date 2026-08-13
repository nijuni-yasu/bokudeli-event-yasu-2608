<script setup lang="ts">
import { mdiFood } from '@mdi/js'
import type { UserProfileFoodPreviewItem } from '@shokujii/common/apis/userProfile.js'
import type {
  ProfileFoodMenuImageSrcFn,
  ProfileMarkFoodMenuImageFailedFn,
} from '@shokujii/base/composable/useProfilePreviewMedia.js'
import type { ProfileLinkPolicyFn, ResolveEventPathFn } from '@shokujii/base/types/profilePathResolvers.js'

defineProps<{
  foods: UserProfileFoodPreviewItem[]
  isInitialLoading: boolean
  canLinkToDetail: ProfileLinkPolicyFn
  resolveEventPath: ResolveEventPathFn
  foodMenuImageSrc: ProfileFoodMenuImageSrcFn
  markFoodMenuImageFailed: ProfileMarkFoodMenuImageFailedFn
}>()

const emit = defineEmits<{
  showMore: []
}>()
</script>

<template>
  <v-card elevation="2" class="profile-panel-card mb-4">
    <v-card-title class="profile-section-card-title d-flex align-center flex-wrap gap-y-2 py-4">
      <v-icon :icon="mdiFood" size="18" class="profile-section-title__icon text-medium-emphasis me-1" />
      <span class="profile-section-title">{{ $t('user_profile.section.foods') }}</span>
      <v-spacer />
      <v-btn variant="text" size="small" @click="emit('showMore')">{{ $t('user_profile.show_more') }}</v-btn>
    </v-card-title>
    <v-card-text class="pt-0">
      <v-row v-if="isInitialLoading" dense>
        <v-col v-for="n in 4" :key="`food-skeleton-${n}`" cols="6" sm="4" md="3">
          <v-skeleton-loader type="image, text@2" class="profile-preview-skeleton" />
        </v-col>
      </v-row>
      <div v-else-if="foods.length === 0" class="text-body-2 text-medium-emphasis">
        {{ $t('user_profile.empty.foods') }}
      </div>
      <v-row v-else dense>
        <v-col v-for="food in foods" :key="food.order_id" cols="6" sm="4" md="3">
          <v-card variant="outlined" class="h-100 preview-card">
            <v-img
              :src="foodMenuImageSrc(food)"
              :alt="food.menu_name"
              cover
              height="120"
              @error="markFoodMenuImageFailed(food.order_id)"
            />
            <v-card-text class="pa-3 pt-2">
              <div
                v-if="food.shop_name !== ''"
                class="profile-preview-tile__meta text-medium-emphasis text-truncate"
                :title="food.shop_name"
              >
                {{ food.shop_name }}
              </div>
              <div
                class="text-body-2 profile-preview-tile__name"
                :class="{ 'mt-1': food.shop_name !== '' }"
                :title="food.menu_name"
              >
                {{ food.menu_name }}
              </div>
              <div v-if="food.event_name !== ''" class="mt-1 min-width-0">
                <router-link
                  v-if="canLinkToDetail(food.is_public, food.is_linkable)"
                  class="food-event-link text-body-2 text-truncate d-block"
                  :to="resolveEventPath(food.community_account, food.event_id)"
                  :title="food.event_name"
                  :aria-label="$t('user_profile.food_event_link_label')"
                >
                  {{ food.event_name }}
                </router-link>
                <span v-else class="text-body-2 text-truncate d-block" :title="food.event_name">
                  {{ food.event_name }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
