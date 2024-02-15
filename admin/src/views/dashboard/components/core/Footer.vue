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
          href: "https://shokujii.jp/",
          text: "食事でつながるshokujii"
        },
        {
          href: "https://about.shokujii.jp/",
          text: "shokujiiって？"
        },
        {
          href: "https://bokudeli.jp/",
          text: "旧ぼくデリ"
        },
        {
          href:
            "https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c",
          text: "利用規約"
        },
        {
          href:
            "https://nijuni.notion.site/shokujii-26a5f4507e5343329d2b7c6bea51030b",
          text: "プライバシーポリシー"
        },
        {
          href:
            "https://drive.google.com/drive/folders/1R40T-y5WqHRZu5ANILIQxgagqoBTlgSr?usp=sharing",
          text: "店舗マニュアル"
        },
        {
          href: "http://nijuni.jp/",
          text: "運営会社"
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
