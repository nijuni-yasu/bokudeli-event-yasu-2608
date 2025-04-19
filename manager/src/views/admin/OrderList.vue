<template>
  <v-container id="regular-tables" fluid tag="section">
    <base-material-card
      inline
      icon="mdi-storefront-outline"
      title="注文一覧"
      class="px-5 py-3"
    >
      <v-simple-table class="body-1">
        <thead>
          <tr>
            <th class="primary--text px-1">
              #
            </th>
            <th class="primary--text px-1">
              店舗名
            </th>
            <th class="primary--text px-1">
              コミュニティ名
            </th>
            <th class="primary--text px-1">
              イベント名
            </th>
            <th class="primary--text px-1">
              公開
            </th>
            <th class="primary--text px-1">
              支払方法
            </th>
            <th class="primary--text px-1">
              USER URL
            </th>
            <th class="primary--text px-1">
              メニュー内容
            </th>
            <th class="primary--text px-1">
              個数
            </th>
            <th class="primary--text px-1">
              金額
            </th>
            <th class="primary--text px-1">
              ステータス
            </th>
            <th class="primary--text px-1">
              イベント<br />
              開始日時
            </th>
            <th class="primary--text px-1">
              イベント<br />
              終了日時
            </th>
            <th class="primary--text px-1">
              注文期限
            </th>
            <th class="primary--text px-1">
              注文日時
            </th>
            <th class="primary--text px-1">
              キャンセル日時
            </th>
            <th class="primary--text px-1">
              カート日時
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, key) in orders" :key="key" cols="12" sm="12" md="6">
            <td class="px-1">
              {{ orders.length - key }}
            </td>
            <td class="px-1">{{ item.shop_name }}</td>
            <td class="px-1">
              <a
                :href="item.event_url"
                target="_blank"
                rel="noopener noreferrer"
                class="url-link"
              >
                {{ item.community_name }}</a
              >
            </td>
            <td class="px-1">
              <a
                :href="item.event_url"
                target="_blank"
                rel="noopener noreferrer"
                class="url-link"
                >{{ item.event_name }}</a
              >
            </td>
            <td class="px-1">{{ item.is_public ? "公開" : "限定" }}</td>
            <td class="px-1">{{ item.event_payment }}</td>
            <td class="px-1">
              <a :href="item.user_url" target="_blank" rel="noopener noreferrer"
                >{{ item.user_url }}
              </a>
            </td>
            <td class="px-1">
              {{ item.menus.map(menu => menu.name).join(", ") }}
            </td>
            <td class="px-1">{{ item.total_count }}</td>
            <td class="px-1">{{ item.total_price }}</td>
            <td class="px-1">{{ item.status }}</td>
            <td class="px-1">{{ item.event_start_datetime }}</td>
            <td class="px-1">{{ item.event_end_datetime }}</td>
            <td class="px-1">{{ item.event_deadline_datetime }}</td>
            <td class="px-1">{{ item.ordered_at }}</td>
            <td class="px-1">{{ item.canceled_at }}</td>
            <td class="px-1">{{ item.carted_at }}</td>
          </tr>
        </tbody>
      </v-simple-table>
    </base-material-card>
  </v-container>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
const db = firebase.firestore();

export default {
  name: "Analytics",

  data: () => ({
    orders: [],
    events: new Map(), // イベント情報を保持するMap
    communities: new Map() // コミュニティ情報を保持するMap
  }),

  async created() {
    // 1. まず全てのイベント情報を取得
    const communitiesSnapshot = await db.collection("communities").get();

    for (const communityDoc of communitiesSnapshot.docs) {
      const communityData = communityDoc.data();
      this.communities.set(communityDoc.id, communityData);

      // 各コミュニティのイベントを取得
      const eventsSnapshot = await communityDoc.ref.collection("events").get();
      eventsSnapshot.forEach(eventDoc => {
        const eventData = eventDoc.data();
        this.events.set(eventDoc.id, {
          ...eventData,
          community_id: communityDoc.id
        });
      });
    }

    // 2. 注文情報を取得してイベント情報と組み合わせる
    const ordersSnapshot = await db
      .collectionGroup("orders")
      .orderBy("created_at", "desc")
      .get();

    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      const event = this.events.get(orderData.event_id);

      if (event) {
        orderData.event_name = event.event_name;
        orderData.community_name = event.community_name;
        orderData.shop_name = event.shop_name;
        orderData.partner_id = event.partner_id;
        orderData.is_public = event.is_public;
        orderData.event_start_datetime = event.event_start_datetime
          ? event.event_start_datetime.toDate().toLocaleString("ja-JP")
          : "-";
        orderData.event_end_datetime = event.event_end_datetime
          ? event.event_end_datetime.toDate().toLocaleString("ja-JP")
          : "-";
        orderData.event_deadline_datetime = event.event_deadline_datetime
          ? event.event_deadline_datetime.toDate().toLocaleString("ja-JP")
          : "-";
        orderData.created_at = orderData.created_at
          ? orderData.created_at.toDate().toLocaleString("ja-JP")
          : "-";
        orderData.canceled_at = orderData.canceled_at
          ? orderData.canceled_at.toDate().toLocaleString("ja-JP")
          : "-";
        orderData.ordered_at = orderData.ordered_at
          ? orderData.ordered_at.toDate().toLocaleString("ja-JP")
          : "-";
        orderData.carted_at = orderData.carted_at
          ? orderData.carted_at.toDate().toLocaleString("ja-JP")
          : "-";
        orderData.user_url = `${process.env.VUE_APP_ORIGIN_HOST}/u/${orderData.user_id}`;
        orderData.community_url = `${process.env.VUE_APP_ORIGIN_HOST}/c/${orderData.community_account}`;
        orderData.event_url = `${process.env.VUE_APP_ORIGIN_HOST}/c/${orderData.community_account}/e/${orderData.event_id}`;

        // メニューの合計金額を計算（個数も考慮）
        orderData.total_price = orderData.menus.reduce((acc, menu) => {
          return acc + menu.price * menu.count;
        }, 0);
        orderData.total_count = orderData.menus.reduce((acc, menu) => {
          return acc + menu.count;
        }, 0);
      }
      this.orders.push(orderData);
    });
  },

  methods: {
    //
  }
};
</script>
<style lang="scss"></style>
