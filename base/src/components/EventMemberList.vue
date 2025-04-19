<script setup lang="ts">
import { type EventMember } from '@/schemes/EventMember'
import UserAvatar from '@/components/UserAvatar.vue'
import { getUserPath } from '@/router/utils'

defineProps<{
  members: EventMember[]
  eventMaxPeople: number
}>()
</script>
<template>
  <section>
    <v-card-text class="text-left pb-10">
      <v-row>
        <v-col
          v-for="member in members"
          :key="member.user_id"
          class="d-flex justify-start pa-2"
          cols="6"
          sm="6"
          md="4"
        >
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
                  v-for="menu in member.orders.flatMap((order) => (order.status === 'ordered' ? order.menus : []))"
                  :key="menu.menu_id"
                  class="d-flex align-center"
                  style="font-size: 12px; color: gray"
                >
                  <div>
                    <span>
                      {{ menu.name }}
                    </span>
                    <span v-if="menu.count > 1"> （{{ menu.count }}個） </span>
                  </div>
                </div>
              </v-col>
            </v-row>
          </router-link>
        </v-col>
      </v-row>
      <slot></slot>
    </v-card-text>
  </section>
</template>
<style lang="scss" scoped>
</style>
