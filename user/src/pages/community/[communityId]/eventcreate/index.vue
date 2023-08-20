<script setup lang="ts">
import EventPostcode from '@/components/eventcreate/EventPostcode.vue'
import EventShop from '@/components/eventcreate/EventShop.vue'
import EventMenu from '@/components/eventcreate/EventMenu.vue'
import EventInfo from '@/components/eventcreate/EventInfo.vue'

const props = defineProps<{
  communityId: string
}>()

const eventSettingsData = {
  information: {
    postcode: '101-0022',
    address: '東京都千代田区神田練塀町3 富士ソフト秋葉原ビル12F',
    shop: '天正',
    date: '2023-02-02',
    time: '15:30',
    title: '第30回 ぼくデリ会',
    description:
      'The name’s John Deo. I am a tireless seeker of knowledge, occasional purveyor of wisdom and also, coincidentally, a graphic designer. Algolia helps businesses across industries quickly create relevant 😎, scaLabel 😀, and lightning 😍 fast search and discovery experiences.',
    community: 'DMM.make AKIBA',
  },
}

const panel = ref(['postcode'])
</script>

<template>
  <v-card>
    <v-expansion-panels v-model="panel" multiple>
      <v-expansion-panel value="postcode">
        <v-expansion-panel-title>郵便番号</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-postcode :information-data="eventSettingsData.information"></event-postcode>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="shop">
        <v-expansion-panel-title>お店</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-shop :information-data="eventSettingsData.information"></event-shop>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="menu">
        <v-expansion-panel-title>メニュー</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-menu :information-data="eventSettingsData.information"></event-menu>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel value="info">
        <v-expansion-panel-title>イベント情報</v-expansion-panel-title>
        <v-expansion-panel-text>
          <event-info :information-data="eventSettingsData.information"></event-info>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<style lang="scss" scoped></style>
