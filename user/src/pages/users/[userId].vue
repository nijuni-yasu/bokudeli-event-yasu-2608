<script setup lang="ts">
import UserBioPanel from '@/components/UserBioPanel.vue'
import UserOrderPanel from '@/components/UserOrderPanel.vue'
import UserCommunityPanel from '@/components/UserCommunityPanel.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  userId: string
}>()

const { storedUser } = storeToRefs(useStoreStoredUser())

const userData = computed(() => useUserStore(props.userId).user)
const tabs = ref(null)
</script>

<template>
  <div id="user-view">
    <v-row v-if="userData != null" justify="center">
      <v-col cols="12" sm="8" md="3">
        <user-bio-panel :user-data="userData" :is-editable="storedUser?.userId === props.userId" />
      </v-col>
        <v-col cols="12" sm="8" md="9">
          <v-tabs v-model="tabs">
            <v-tab value="0">
              <v-icon start>
                mdi-calendar-star
              </v-icon>
              イベント
            </v-tab>
            <v-tab value="1">
              <v-icon start>
                mdi-account-group
              </v-icon>
              参加コミュニティ
            </v-tab>
            <v-tab value="2">
              <v-icon start>
                mdi-heart-outline
              </v-icon>
              運営コミュニティ
            </v-tab>
          </v-tabs>
          <v-window v-model="tabs">
            <v-window-item value="0">
              <v-col
                cols="12" md="12" sm="12"
              >
                <user-order-panel :user-id="props.userId" :show-detail="storedUser?.userId === props.userId" />
              </v-col>
            </v-window-item>
            <v-window-item value="1">
              <v-col
                cols="12" md="12" sm="12"
              >
                <user-community-panel :user-id="props.userId" type="members" :is-login-user="storedUser?.userId === props.userId"/>
              </v-col>
            </v-window-item>
            <v-window-item value="2">
              <v-col
                cols="12" md="12" sm="12"
              >
                <user-community-panel :user-id="props.userId" type="managers" :is-login-user="storedUser?.userId === props.userId"/>
              </v-col>
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>

      <v-row v-else justify="center">
        <v-col cols="auto">
          <v-progress-circular indeterminate color="primary" />
        </v-col>
    </v-row>
  </div>
</template>
<style lang="scss" scoped></style>
