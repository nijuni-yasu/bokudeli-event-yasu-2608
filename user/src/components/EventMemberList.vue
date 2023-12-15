<script setup lang="ts">
import { EventMember } from '@/schemes/EventMember'

import { loadEventMembers } from '@/composable/loadEventMembers'

const props = defineProps<{
  communityId: string
  eventId: string
  eventMaxPeople: number
}>()

const emit = defineEmits<{
  (e: 'updateMembers', count: number): void
}>()

const state = reactive({
  members: [] as EventMember[],
  isLoading: true,
  event_max_people: props.eventMaxPeople as number,
})

const fetchData = async () => {
  state.members = await loadEventMembers(props.communityId, props.eventId)
  state.isLoading = false
  emit('updateMembers', state.members.length)
}

onBeforeRouteUpdate(async (to, from, next) => {
  await fetchData()
  next()
})

onMounted(async () => {
  await fetchData()
})
</script>
<template>
  <section>
    <div v-if="!state.isLoading">
      <v-card-text class="event-item">
        【参加者】
        <span class="event-content">
          {{ state.members.length }} 人 / {{ state.event_max_people }} 人
        </span>
      </v-card-text>
      <v-card-text class="text-left pb-10">
        <v-row>
          <v-col
            v-for="member in state.members"
            :key="member.userId"
            class="d-flex justify-start pa-2"
            cols="12"
            sm="6"
            md="4"
          >
            <v-row class="ma-0 d-flex align-center">
              <router-link :to="`/users/${member.userId}`" class="text--primary cursor-pointer text-decoration-none">
                <v-avatar class="ma-1" size="60">
                  <v-img :src="member.userImageUrl" cover/>
                </v-avatar>
              </router-link>
              <v-col class="ma-0 px-1">
                <div class="d-flex align-center text-subtitle-2 font-weight-bold">
                  <div>
                    {{ member.username }}
                  </div>
                </div>
                <div
                  v-for="menu in member.menus"
                  :key="menu"
                  class="d-flex align-center"
                  style="font-size: 12px; color: gray"
                >
                  <div>{{ menu }}</div>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
    </div>
    <div v-else class="text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
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
