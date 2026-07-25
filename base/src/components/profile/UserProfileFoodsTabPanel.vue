<script setup lang="ts">
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import type {
  ProfileFoodMenuImageSrcFn,
  ProfileMarkFoodMenuImageFailedFn,
} from '@shokujii/base/composable/useProfilePreviewMedia.js'
import type { ProfileLinkPolicyFn, ResolveEventPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import type { UserProfileFoodPreviewItem } from '@shokujii/common/apis/userProfile.js'

defineProps<{
  pagedFoods: UserProfileFoodPreviewItem[]
  foodLoading: boolean
  foodError: unknown
  foodHasMore: boolean
  showFoodsTabEmpty: boolean
  canLinkToDetail: ProfileLinkPolicyFn
  resolveEventPath: ResolveEventPathFn
  foodMenuImageSrc: ProfileFoodMenuImageSrcFn
  markFoodMenuImageFailed: ProfileMarkFoodMenuImageFailedFn
  onLoadMore?: () => void
}>()

const { t: $t } = useI18n()
</script>

<template>
  <div v-if="foodLoading && pagedFoods.length === 0" class="d-flex justify-center pa-6">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <div v-else-if="foodError != null" class="text-body-1 text-medium-emphasis pa-6">
    {{ $t('user_profile.failed_to_load') }}
  </div>
  <template v-else>
    <div v-if="showFoodsTabEmpty" class="text-body-1 text-medium-emphasis pa-4">
      {{ $t('user_profile.empty.foods') }}
    </div>
    <v-row v-if="pagedFoods.length > 0">
      <v-col v-for="food in pagedFoods" :key="food.order_id" cols="12" sm="6" md="4">
        <v-card elevation="2" class="h-100 preview-card profile-panel-card">
          <v-img
            :src="foodMenuImageSrc(food)"
            :alt="food.menu_name"
            cover
            height="180"
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
            <div v-if="food.event_name !== ''" class="mt-2 min-width-0">
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
    <v-row v-if="foodHasMore || pagedFoods.length > 0" class="justify-center mt-2">
      <v-col cols="auto">
        <IncrementalLoader
          :loaded-count="pagedFoods.length"
          :total-count="foodHasMore ? Number.MAX_SAFE_INTEGER : pagedFoods.length"
          @load="onLoadMore?.()"
        />
      </v-col>
    </v-row>
  </template>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
