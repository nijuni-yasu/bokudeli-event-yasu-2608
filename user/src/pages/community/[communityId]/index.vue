<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import memberList from '@/assets/examples/memberList'
import eventList from '@/assets/examples/eventList'

const route = useRoute()
const router = useRouter()
const goToEvents = (eventId: number) => {
  const path = route.path.endsWith('/') ? `${route.path}events/${eventId}` : `${route.path}/events/${eventId}`
  router.push({ path })
}
const communityImage = new URL('@/assets/images/bokudeli/community_dmmmakeakiba.png', import.meta.url).href
const communityLogo = new URL('@/assets/images/bokudeli/icon_dmmmakeakiba.png', import.meta.url).href
</script>
<template>
  <section>
    <v-row class="justify-center">
      <!-- community main -->
      <v-col cols="12" md="9" sm="9">
        <v-card flat class="align-center justify-center text-center my-10 pa-10">
          <v-row>
            <v-col>
              <VImg class="ma-0" :src="communityImage" />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-card-title class="justify-center text-h4 pb-3">DMM.make AKIBA</v-card-title>
              <v-card-text class="text-left pb-8">dummy text</v-card-text>
            </v-col>
          </v-row>
        </v-card>

        <!-- community event list -->
        <v-row>
          <!-- community description -->
          <v-col md="4" sm="4" cols="12">
            <v-card class="mx-0 pa-8" color="text-center">
              <!-- community title and links -->
              <VImg class="pb-5" style="border-radius: 10px" aspect-ratio="1" :src="communityLogo" />
              <v-card-title class="justify-center text-h6 pb-5"> DMM.make AKIBA </v-card-title>
              <v-card-text class="text-left pb-3">
                <a href="https://akiba.dmm.com/" class="text-decoration-none" target="_blank">
                  https://akiba.dmm.com/
                </a>
              </v-card-text>
              <v-card-text>
                <a href="https://twitter.com/dmm_make" class="text-decoration-none" target="_blank">
                  https://twitter.com/DMM_make_AKIBA
                </a>
              </v-card-text>
              <v-card-text>
                <a href="https://www.youtube.com/@DMM_make_AKIBA" class="text-decoration-none" target="_blank">
                  https://www.youtube.com/@DMM_make_AKIBA
                </a>
              </v-card-text>
              <v-card-text>
                <a href="https://akiba.dmm.com/form/contact" class="text-decoration-none" target="_blank">
                  問い合わせ
                </a>
              </v-card-text>

              <!-- community member -->
              <v-card-title class="justify-center text-h6"> MEMBER </v-card-title>
              <v-list class="pt-0">
                <v-list-item v-for="(data, index) in memberList" :key="index" class="d-flex align-center px-0">
                  <router-link :to="`/users/${data.id}`" class="text--primary cursor-pointer text-decoration-none">
                    <v-row>
                      <v-list-item><v-avatar :image="data.avatar" /></v-list-item>
                      <div class="d-flex align-center flex-wrap flex-grow-1">
                        <v-list-item-title>{{ data.name }}</v-list-item-title>
                        <v-spacer />
                      </div>
                    </v-row>
                  </router-link>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
          <!-- events -->
          <v-col md="8" sm="8" cols="12">
            <v-row>
              <v-col v-for="(event, index) in eventList" :key="index" md="6" sm="6" cols="12">
                <v-card class="mx-0" color="text-color cursor-pointer" @click="goToEvents(event.id)">
                  <v-img :src="event.character" aspect-ratio="2" />
                  <v-card-title class="justify-center text-h5 pb-3">
                    {{ event.title }}
                  </v-card-title>
                  <v-card-text class="text-left pb-8">
                    {{ event.desc }}
                  </v-card-text>
                  <v-card-text class="text-left pb-2"> 【主催者】 {{ event.community }} </v-card-text>
                  <v-card-text class="text-left pb-2"> 【注文期限】{{ event.orderDate }} </v-card-text>
                  <v-card-text class="text-left pb-2"> 【開催日時】{{ event.eventDate }} </v-card-text>
                  <v-card-text class="text-left pb-2"> 【開催場所】{{ event.place }} </v-card-text>
                  <v-card-text class="text-left pb-2"> 【お店】 {{ event.shop }} </v-card-text>
                  <v-card-text class="text-left pb-8"> 【最大人数】{{ event.max }} </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </section>
</template>
<style lang="scss" scoped></style>
