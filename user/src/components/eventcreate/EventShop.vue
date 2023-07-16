<script setup lang="ts">
import shop01 from '@/assets/images/bokudeli/shop_ex_01.png'
import shop02 from '@/assets/images/bokudeli/shop_ex_02.png'
import shop03 from '@/assets/images/bokudeli/shop_ex_03.png'
import shop04 from '@/assets/images/bokudeli/shop_ex_04.png'
import shop05 from '@/assets/images/bokudeli/shop_ex_05.png'

const props = defineProps<{
  informationData: any
}>()
const optionsLocal = ref(JSON.parse(JSON.stringify(props.informationData)))

const resetForm = () => {
  optionsLocal.value = JSON.parse(JSON.stringify(props.informationData))
}
const shopContent = [
  {
    shopImage: shop02,
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: '神保町 牛魔王',
    week: '日曜日,月曜日,火曜日,木曜日,金曜日',
    time: '11:00~12:00,13:00~18:00',
  },
  {
    shopImage: shop01,
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: '御徒町天ぷら 天正',
    week: '日曜日,月曜日,火曜日,木曜日,金曜日',
    time: '11:00~12:00,13:00~18:00',
  },
  {
    shopImage: shop03,
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: '秋葉原カリー',
    week: '日曜日,月曜日,火曜日,木曜日,金曜日',
    time: '11:00~12:00,13:00~18:00',
  },
  {
    shopImage: shop04,
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: '神田中華店',
    week: '日曜日,月曜日,火曜日,木曜日,金曜日',
    time: '11:00~12:00,13:00~18:00',
  },
  {
    shopImage: shop05,
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'AKIBAケバブ',
    week: '日曜日,月曜日,火曜日,木曜日,金曜日',
    time: '11:00~12:00,13:00~18:00',
  },
]
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="10">
      <v-card flat class="pa-3 mt-2">
        <v-form class="multi-col-validation">
          <v-card-title class="mt-5">
            <v-icon size="50" class="text--primary me-3" icon="mid-chart-timeline-variant" />
            <span>お店</span>
          </v-card-title>

          <!-- Activity -->
          <v-row>
            <v-col v-for="item in shopContent" :key="item.shop" md="4" sm="4" cols="12">
              <v-card class="mb-3 mx-0" color="text-center cursor-pointer">
                <v-img :src="item.shopImage" cover aspect-ratio="1.91"></v-img>

                <!-- title -->
                <v-card-title class="justify-center pb-3">
                  {{ item.shop }}
                </v-card-title>
                <v-card-text class="text-left pb-3">
                  {{ item.desc }}
                </v-card-text>
                <v-card-text class="text-left pb-3"> 曜日：{{ item.week }} </v-card-text>
                <v-card-text class="text-left pb-3"> 時間：{{ item.time }} </v-card-text>
                <v-btn target="blank" color="primary" class="my-3"> このお店にする </v-btn>
              </v-card>
            </v-col>

            <!-- no result found -->
            <v-col v-show="!shopContent.length" cols="12" class="text-center">
              <h4 class="mt-4">Search result not found!!</h4>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>
<style lang="scss" scoped></style>
