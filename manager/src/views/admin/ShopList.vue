<template>
  <v-container
    id="regular-tables"
    fluid
    tag="section"
  >
    <base-material-card
      inline
      icon="mdi-storefront-outline"
      title="店舗一覧"
      class="px-5 py-3"
    >
      <v-simple-table
        class="body-1"
      >
        <thead>
          <tr>
            <th class="primary--text px-1">
              #
            </th>
            <th class="primary--text px-1">
              PARTNER ID
            </th>
            <th class="primary--text px-1 table1">
              店舗名
            </th>
            <th class="primary--text px-1 table1">
              店舗住所
            </th>
            <th class="primary--text px-1">
              緯度・軽度
            </th>
            <th class="primary--text px-1">
              電話番号
            </th>
            <th class="primary--text px-1 table2">
              メールアドレス
            </th>
            <th class="primary--text px-1">
              注文締切
            </th>
            <th class="primary--text px-1 table1">
              距離と個数
            </th>
            <th class="primary--text px-1 table2">
              注文可能時間
            </th>
            <th class="primary--text px-1">
              作成日
            </th>
            <th class="primary--text px-1">
              更新日
            </th>
            <th class="primary--text table1">
              開店設定(is_open)<br>
              運営承認(is_approved)
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(item,key) in shops"
            :key="key"
            cols="12"
            sm="12"
            md="6"
          >
            <td class="px-1">
              <v-btn
                color="primary"
                small
                @click="toMenuPage(item.partner_id)"
              >
              <v-icon>
                mdi-storefront-outline
              </v-icon>
                詳細
              </v-btn>
            </td>
            <td class="px-1">{{ item.partner_id.slice(0, 6) }}</td>
            <td class="px-1 table1">{{ item.shop_name }}</td>
            <td class="px-1 table1">
              〒{{ item.shop_postcode }}<br>
              {{ item.shop_address }}
            </td>
            <td class="px-1">
              {{ item.shop_address_latitude }}<br>
              {{ item.shop_address_longitude }}
            </td>
            <td class="px-1">{{ item.shop_phone }}</td>
            <td class="px-1 table2">
              {{ item.shop_email }}<br>
              {{ item.shop_email_sub1 }}<br>
              {{ item.shop_email_sub2 }}<br>
              {{ item.shop_email_sub3 }}
            </td>
            <td>{{ item.shop_deadline_date }} {{ item.shop_deadline_time }}</td>
            <td  class="px-1 table1">
              <div v-if="item.shop_range_min_orders[0].range">
                [設定1] {{ item.shop_range_min_orders[0].range }}km  {{ item.shop_range_min_orders[0].min_orders }}個<br>
              </div>
              <div v-if="item.shop_range_min_orders[1].range">           
                [設定2] {{ item.shop_range_min_orders[1].range }}km  {{ item.shop_range_min_orders[1].min_orders }}個<br>
              </div>
              <div v-if="item.shop_range_min_orders[2].range">
                [設定3] {{ item.shop_range_min_orders[2].range }}km  {{ item.shop_range_min_orders[2].min_orders }}個<br>
              </div>
              <div v-if="item.shop_range_min_orders[3].range">
                [設定4] {{ item.shop_range_min_orders[3].range }}km  {{ item.shop_range_min_orders[3].min_orders }}個<br>
              </div>
              <div v-if="item.shop_range_min_orders[4].range">          
                [設定5] {{ item.shop_range_min_orders[4].range }}km  {{ item.shop_range_min_orders[4].min_orders }}個
              </div>
            </td>

            <td  class="px-1 table2">
              <div v-if="item.shop_time[0].is_open">
                {{ item.shop_time[0].label_ja }} {{ item.shop_time[0].time_start }}~{{ item.shop_time[0].time_end }} , {{ item.shop_time[0].time_start2 }}~{{ item.shop_time[0].time_end2 }}<br>
              </div>
              <div v-if="item.shop_time[1].is_open">
                {{ item.shop_time[1].label_ja }} {{ item.shop_time[1].time_start }}~{{ item.shop_time[1].time_end }} , {{ item.shop_time[1].time_start2 }}~{{ item.shop_time[1].time_end2 }}<br>
              </div>
              <div v-if="item.shop_time[2].is_open">
                {{ item.shop_time[2].label_ja }} {{ item.shop_time[2].time_start }}~{{ item.shop_time[2].time_end }} , {{ item.shop_time[2].time_start2 }}~{{ item.shop_time[2].time_end2 }}<br>
              </div>
              <div v-if="item.shop_time[3].is_open">
                {{ item.shop_time[3].label_ja }} {{ item.shop_time[3].time_start }}~{{ item.shop_time[3].time_end }} , {{ item.shop_time[3].time_start2 }}~{{ item.shop_time[3].time_end2 }}<br>
              </div>
              <div v-if="item.shop_time[4].is_open">
                {{ item.shop_time[4].label_ja }} {{ item.shop_time[4].time_start }}~{{ item.shop_time[4].time_end }} , {{ item.shop_time[4].time_start2 }}~{{ item.shop_time[4].time_end2 }}<br>
              </div>
              <div v-if="item.shop_time[5].is_open">
                {{ item.shop_time[5].label_ja }} {{ item.shop_time[5].time_start }}~{{ item.shop_time[5].time_end }} , {{ item.shop_time[5].time_start2 }}~{{ item.shop_time[5].time_end2 }}<br>
              </div>
              <div v-if="item.shop_time[6].is_open">
                {{ item.shop_time[6].label_ja }} {{ item.shop_time[6].time_start }}~{{ item.shop_time[6].time_end }} , {{ item.shop_time[6].time_start2 }}~{{ item.shop_time[6].time_end2 }}<br>
              </div>
            </td>
            <td class="px-1">
                {{ item.createdAt.toDate().getFullYear() + '/' + (Number(item.createdAt.toDate().getMonth()) + 1) + '/' +item.createdAt.toDate().getDate() }}<br>
                {{ item.createdAt.toDate().toLocaleString('ja-JP').slice( -8 ).slice( 0, 5 ) }}</td>
            <td></td>
            <td class="px-1 table1">
              <v-switch
                v-model="item.is_open"
                :label="`${item.is_open?'開店(OPEN)':'閉店(CLOSE)'}`"
                readonly
              />
              <v-switch
                v-model="item.is_approved"
                :label="`${item.is_approved?'運営承認済':'未承認'}`"
                readonly
              />
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </base-material-card>
  </v-container>
</template>

<script>
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  const db = firebase.firestore()

  export default {
    name: 'Analytics',

    data: () => ({
      partners: [],
      shops: [],
    }),
    created () {
      const self = this
      db.collectionGroup('shops').get().then((snapshot) => {
        snapshot.forEach((doc) => {
          self.shops.push(doc.data())
        })
      })
    },
    methods: {
      toMenuPage: function (partnerId) {
        console.log(partnerId)
        this.$store.commit('SET_PARTNER_ID', partnerId)
        this.$router.push('ShopList/Menu')
      },
    }
  }
</script>
<style lang="scss">
.table1{
  width:150px;
}
.table2{
  width:270px;
}
</style>