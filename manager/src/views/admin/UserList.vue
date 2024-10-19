<template>
  <v-container
    id="regular-tables"
    fluid
    tag="section"
  >
    <base-material-card
      inline
      icon="mdi-calendar"
      title="コミュニティ一覧"
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
              ユーザー名
            </th>
            <th class="primary--text px-1">
              メールアドレス
            </th>
            <th class="primary--text px-1">
              MyPage
            </th>
            <th class="primary--text px-1">
              プロフィール
            </th>
            <th class="primary--text px-1">
              Xアカウント
            </th>
            <th class="primary--text px-1">
              Facebookアカウント
            </th>
            <th class="primary--text px-1">
              Instagramアカウント
            </th>
            <th class="primary--text px-1">
              作成日 created_at
            </th>
            <th class="primary--text px-1">
              更新日 updated_at
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(user,key) in users"
            :key="key"
          >
            <td class="px-1">
              {{ users.length - key }}
            </td>
            <td class="px-1">
              {{ user.user_name }}
            </td>
            <td class="px-1">
              {{ user.user_email }}
            </td>
            <td class="px-1">
              <a
                :href="`https://shokujii.jp/u/${user.user_id}`"
                target="_blank"
              >
                https://shokujii.jp/u/{{user.user_id}}
              </a>
            </td>
            <td class="px-1">
                {{ user.user_description }}
            </td>
            <td class="px-1">
              <a
                :href="`https://x.com/${user.user_sns_twitter}`"
                target="_blank"
              >
                {{ user.user_sns_twitter }}
              </a>
            </td>
            <td class="px-1">
              <a
                :href="`https://facebook.com/${user.user_sns_facebook}`"
                target="_blank"
              >
                {{ user.user_sns_facebook }}
              </a>
            </td>
            <td class="px-1">
              <a
                :href="`https://instagram.com/${user.user_sns_instagram}`"
                target="_blank"
              >
                {{ user.user_sns_instagram }}
              </a>
            </td>
            <td class="px-1">
              {{ user.created_at ? user.created_at.toDate().toLocaleString() : 'ー'}}
            </td>
            <td class="px-1">
              {{ user.updated_at ? user.updated_at.toDate().toLocaleString() : 'ー'}}
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </base-material-card>
  </v-container>
</template>

<script>
  import firebase, { auth } from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/auth'
  const db = firebase.firestore()

  export default {
    name: 'UserList',

    data: () => ({
      users: [],
    }),
    created () {
      const self = this
      db.collectionGroup('users').orderBy('created_at','desc').get().then((snapshot) => {
        snapshot.forEach((doc) => {
          if (!doc.data().user_name) return
          self.users.push(doc.data())
        })
      })
    },
  }
</script>
<style lang="scss">
</style>