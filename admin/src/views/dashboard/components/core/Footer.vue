<template>
  <v-footer
    id="dashboard-core-footer"
  >
    <v-container>
      <v-row
        align="center"
        no-gutters
      >
        <v-col
          v-for="(link, i) in links"
          :key="i"
          class="text-center mb-sm-0 mb-5"
          cols="auto"
        >
          <a
            :href="link.href"
            class="mr-0 grey--text text--darken-3"
            rel="noopener"
            target="_blank"
            v-text="link.text"
          />
        </v-col>

        <v-spacer class="hidden-sm-and-down" />

        <v-col
          cols="12"
          md="auto"
        >
          <div class="body-1 font-weight-light pt-6 pt-md-0 text-center">
            &copy; 2023, nijuni inc.
            <!-- <v-icon size="20">
              mdi-heart
            </v-icon>
            by Creative Tim for a better web. -->
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script>
  export default {
    name: 'DashboardCoreFooter',

    data: () => ({
      links: [
        {
          href: 'https://bokudeli.jp/',
          text: 'ぼくデリ（公式サイト）',
        },
        {
          href: 'https://www.notion.so/6ebc3a56ad9f4ca795e7f16f1031033d',
          text: '利用規約',
        },
        {
          href: 'https://www.notion.so/809020481eb74ce4bc8f1b6286979e82',
          text: 'プライバシーポリシー',
        },
        {
          href: 'https://drive.google.com/drive/folders/1R40T-y5WqHRZu5ANILIQxgagqoBTlgSr?usp=sharing',
          text: '店舗マニュアル',
        },
        {
          href: 'https://lin.ee/7VwZjvC',
          text: 'サポートLINE',
        },
        {
          href: 'http://nijuni.jp/',
          text: '運営会社',
        },

      ],
    }),
  }
</script>

<style lang="sass">
  #dashboard-core-footer
    a
      font-size: .825rem
      font-weight: 500
      text-decoration: none
      text-transform: uppercase
</style>
