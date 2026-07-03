<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import LegalDates from './components/LegalDates.vue'
import LegalFooter from './components/LegalFooter.vue'
import LegalHeader from './components/LegalHeader.vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-top>
      <LegalHeader />
    </template>
    <template #doc-footer-before>
      <LegalDates :effective-date="frontmatter.effective_date" :revised-dates="frontmatter.revised_dates" />
    </template>
    <template #footer>
      <LegalFooter />
    </template>
  </DefaultTheme.Layout>
</template>
