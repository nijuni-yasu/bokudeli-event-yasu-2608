<script setup lang="ts">
import topLogo from '@/assets/images/bokudeli/bokudeli_top.png'
import contents from '@/assets/sample_data'
</script>

<template>
  <div>
    <VCard class="d-flex align-center justify-center text-center mb-10" flat>
      <v-img :src="topLogo"></v-img>
    </VCard>
    <VRow class="mb-2">
      <VCol
        v-for="content in contents"
        :key="content.mainImage"
        md="4"
        sm="6"
        cols="12"
        class="content"
      >
      <VCard color="text-center cursor-pointer">
        <router-link to="/events/1">
          <div class="image">
            <VImg
              cover
              class="mx-auto"
              aspect-ratio="1.91"
              :src="content.mainImage"
            />
          </div>
        </router-link>
        <VCardTitle class="justify-center pb-3 title">
          {{ content.title }}
        </VCardTitle>
        <VCardText class="text-left pb-8">
          {{ content.desc }}
        </VCardText>
        <VCardText class="text-left pb-2">
          【主催者】 {{ content.community }}
        </VCardText>
        <VCardText class="text-left pb-2">
          【注文期限】{{ content.orderDate }}
        </VCardText>
        <VCardText class="text-left pb-2">
          【開催日時】{{ content.eventDate }}
        </VCardText>
        <VCardText class="text-left pb-2">
          【開催場所】{{ content.place }}
        </VCardText>
        <VCardText class="text-left pb-2">
          【お店】 {{ content.shop }}
        </VCardText>
        <VCardText class="text-left pb-8">
          【最大人数】{{ content.max }}
        </VCardText>
      </VCard>
    </VCol>
    </VRow>
    <!-- <VCard
      class="mb-6"
      title="Kick start your project 🚀"
    >
      <VCardText>All the best for your new project.</VCardText>
      <VCardText>
        Please make sure to read our <a
          href="https://themeselection.com/demo/materio-vuetify-vuejs-admin-template/documentation"
          target="_blank"
          rel="noopener noreferrer"
          class="text-decoration-none"
        >
          Template Documentation
        </a> to understand where to go from here and how to use our template.
      </VCardText>
    </VCard>

    <VCard title="Want to integrate JWT? 🔒">
      <VCardText>We carefully crafted JWT flow so you can implement JWT with ease and with minimum efforts.</VCardText>
      <VCardText>Please read our  JWT Documentation to get more out of JWT authentication.</VCardText>
    </VCard> -->
  </div>
</template>

<style lang="scss" scoped>
.content {
  .image {
    position: relative;
    background: #fafafa;

    .v-image {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }
  }

  .title {
    text-align: center;
  }
}
</style>