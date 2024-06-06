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
            <th class="primary--text px-1 table2">
              #
            </th>
            <th class="primary--text px-1 table1">
              アカウント
            </th>
            <th class="primary--text px-1 table1">
              コミュニティ名
            </th>
            <th class="primary--text px-1 table1">
              会社名/団体名
              担当者名
            </th>
            <th class="primary--text px-1 table1">
              郵便番号
              住所
              電話番号
              email
            </th>
            <th class="primary--text px-1 table1">
              SNSアカウント
            </th>
            <th class="primary--text px-1 table1">
              利用目的
            </th>
            <th class="primary--text px-1 table1">
              ステータス
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(community,key) in communities"
            :key="key"
          >
            <td class="px-1">{{ key + 1 }}</td>
            <td class="px-1 table1">{{ community.community_account }}</td>
            <td class="px-1 table1">{{ community.community_name }}</td>
            <td class="px-1 table1">
              {{ community.community_company }}<br>
              {{ community.community_manager_fullname }}
            </td>
            <td class="px-1 table1">
              {{ community.community_postalcode  }}<br>
              {{ community.community_address  }}<br>
              {{ community.community_phone  }}<br>
              {{ community.community_email  }}
            </td>
            <td class="px-1 table1">
              {{ community.community_sns_officialsite  }}<br>
              {{ community.community_sns_facebook  }}<br>
              {{ community.community_sns_instagram  }}<br>
              {{ community.community_sns_twitter  }}<br>
            </td>
            <td class="px-1 table1">{{ community.community_use_purpose }}</td>
            <td class="px-1 table1">
              <v-switch
                v-model="community.is_public"
                :label="`${community.is_public?'公開':'限定公開'}`"
                @change="changeCommunityStatus(community)"
              />
              <v-switch
                v-model="community.is_approved"
                :label="`${community.is_approved?'運営承認済':'未承認'}`"
                @change="changeCommunityStatus(community)"
              />
            </td>
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
    name: 'CommunityList',

    data: () => ({
      communities: [],
    }),
    created () {
      const self = this
      db.collectionGroup('communities').orderBy('updated_at','desc').get().then((snapshot) => {
        snapshot.forEach((doc) => {
          self.communities.push(doc.data())
        })
      })
    },
    methods: {
      changeCommunityStatus: function (item) {
        console.log(firebase.auth().currentUser.uid)
        db.collection('commuinties').doc(item.community_id).update({
          is_public: item.is_public,
          is_approved: item.is_approved
        }).then(() => {
          window.alert('公開設定/承認設定を変更しました')
          console.log('Document successfully written!')
        }).catch((error) => {
          window.alert('公開設定/承認設定を変更できませんでした')
          console.error('Error writing document: ', error)
        })
      },

    },

  }
</script>
<style lang="scss">
.table1{
  width:150px;
}
.table2{
  width:75px;
}
</style>