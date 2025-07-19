<script setup lang="ts">
defineProps<{
  code: string
}>()
</script>

<template>
  <v-container class="my-16">
    <v-row justify="center">
      <v-col cols="12" class="text-center">
        <p class="large-text font-weight-bold mb-0"></p>
        <p class="text-h1 font-weight-bold mb-5">{{ $t(`error.${code}.title`) }}</p>
        <p class="text-h6 mb-2" style="line-height: 2" v-html="$t(`error.${code}.description`)"></p>
        <p class="mt-10">
          <v-btn to="/" color="primary" variant="outlined">
            {{ $t('back_to_top') }}
          </v-btn>
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>
