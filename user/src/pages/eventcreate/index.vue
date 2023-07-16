<script setup="ts">
import EventPostcode from '@/components/eventcreate/EventPostcode.vue'
import EventShop from '@/components/eventcreate/EventShop.vue'
import EventMenu from '@/components/eventcreate/EventMenu.vue'
import EventInfo from '@/components/eventcreate/EventInfo.vue'

// tabs
const tabs = [
  { title: '郵便番号', value: 'postcode' },
  { title: 'お店', value: 'shop' },
  { title: 'メニュー', value: 'menu' },
  { title: 'イベント情報', value: 'info' },
]

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

const tab = ref('')
</script>

<template>
  <v-card>
    <!-- tabs -->
    <v-tabs v-model="tab" show-arrows>
      <v-tab v-for="tabInfo in tabs" :key="tabInfo.value" :value="tabInfo.value">
        <v-icon size="20" class="me-3" icon="mdi-information-outline" />
        <span>{{ tabInfo.title }}</span>
      </v-tab>
    </v-tabs>

    <!-- tabs item -->
    <v-window v-model="tab">
      <v-window-item value="postcode">
        <event-postcode :information-data="eventSettingsData.information"></event-postcode>
      </v-window-item>

      <v-window-item value="shop">
        <event-shop :information-data="eventSettingsData.information"></event-shop>
      </v-window-item>

      <v-window-item value="menu">
        <event-menu :information-data="eventSettingsData.information"></event-menu>
      </v-window-item>

      <v-window-item value="info">
        <event-info :information-data="eventSettingsData.information"></event-info>
      </v-window-item>
    </v-window>
  </v-card>
</template>

<style lang="scss" scoped></style>
