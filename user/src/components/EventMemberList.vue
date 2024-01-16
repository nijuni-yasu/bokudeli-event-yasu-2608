<script setup lang="ts">
import { EventMember } from '@/schemes/EventMember'

defineProps<{
  members: EventMember[]
  eventMaxPeople: number
}>()
</script>
<template>
  <section>
    <v-card-text class="event-item">
      【参加者】
      <span class="event-content">
        {{ members.length }} 人 / {{ eventMaxPeople }} 人
      </span>
    </v-card-text>
    <v-card-text class="text-left pb-10">
      <v-row>
        <v-col
          v-for="member in members"
          :key="member.user_id"
          class="d-flex justify-start pa-2"
          cols="12"
          sm="6"
          md="4"
        >
          <v-row class="ma-0 d-flex align-center">
            <router-link :to="`/users/${member.user_id}`" class="text--primary cursor-pointer text-decoration-none">
              <v-avatar class="ma-1" size="60">
                <v-img :src="member.user_image_url" cover/>
              </v-avatar>
            </router-link>
            <v-col class="ma-0 px-1">
              <div class="d-flex align-center text-subtitle-2 font-weight-bold">
                <div>
                  {{ member.user_name }}
                </div>
              </div>
              <div
                v-for="menu in member.orders.flatMap(order => (order.status === 'ordered') ? order.menus : [])"
                :key="menu.menu_id"
                class="d-flex align-center"
                style="font-size: 12px; color: gray"
              >
                <div>{{ menu.name }}({{ menu.count }})</div>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
  </section>
</template>
<style lang="scss" scoped>
  .event-item{
    font-size: 14px;
    padding-top: 0px;
    padding-bottom: 20px;
    font-weight: 600;
  }
  .event-content{
    font-size: 18px;
    padding-bottom: 20px;
    font-weight: 400;
    line-height: 32px;
    white-space: pre-line;
  }
</style>
