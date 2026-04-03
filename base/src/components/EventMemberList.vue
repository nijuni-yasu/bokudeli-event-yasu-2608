<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { type BokudeliEventMember } from '@shokujii/base/stores/event.js'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { getUserPath } from '@/router/utils'
const { t: $t } = useI18n()

defineProps<{
  members: BokudeliEventMember[]
  eventMaxPeople: number
  isShowMember: boolean
}>()

function groupOrderedMenus(orders: EventMemberOrder[]): [string, { name: string; count: number }][] {
  const map: Record<string, { name: string; count: number }> = {}
  for (const o of orders) {
    if (o.status !== 'ordered') continue
    if (!map[o.menu_id]) map[o.menu_id] = { name: o.menu_name, count: 0 }
    map[o.menu_id].count++
  }
  return Object.entries(map)
}
</script>
<template>
  <section>
    <v-card-text class="text-left px-5">
      <v-row v-if="isShowMember === true">
        <v-col v-for="member in members" :key="member.user_id" class="d-flex justify-start pa-2" cols="6" sm="6" md="4">
          <router-link
            :to="getUserPath(member.user_id)"
            class="text--primary cursor-pointer text-decoration-none d-flex align-center"
          >
            <v-row class="ma-0 d-flex align-center">
              <UserAvatar :user="member" :size="60" />
              <v-col class="ma-0 px-1">
                <div class="d-flex align-center text-subtitle-2 font-weight-bold">
                  <div>
                    {{ member.user_name }}
                  </div>
                </div>
                <div
                  v-for="[menuId, group] in groupOrderedMenus(member.orders)"
                  :key="menuId"
                  class="d-flex align-center"
                  style="font-size: 12px; color: gray"
                >
                  <div>
                    <span>{{ group.name }}</span>
                    <span v-if="group.count > 1"> {{ $t('event_details.order_count', [group.count]) }} </span>
                  </div>
                </div>
              </v-col>
            </v-row>
          </router-link>
        </v-col>
      </v-row>
      <!-- コミュニティの設定によっては参加者氏名を非表示にし、リンクをなくす -->
      <v-row v-else-if="isShowMember === false">
        <v-col v-for="member in members" :key="member.user_id" class="d-flex justify-start pa-2" cols="6" sm="6" md="4">
          <v-row class="ma-0 d-flex align-center">
            <UserAvatar :user="member" :size="60" />
            <v-col class="ma-0 pl-2">
              <div
                v-for="[menuId, group] in groupOrderedMenus(member.orders)"
                :key="menuId"
                class="d-flex align-center"
                style="font-size: 12px; color: gray"
              >
                <div>
                  <span>{{ group.name }}</span>
                  <span v-if="group.count > 1"> {{ $t('event_details.order_count', [group.count]) }} </span>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <slot></slot>
    </v-card-text>
  </section>
</template>
<style lang="scss" scoped></style>
