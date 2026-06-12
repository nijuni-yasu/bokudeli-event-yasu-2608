<script setup lang="ts">
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { useEnterpriseStore } from '@/stores/enterprise'
import EmployeeLoginForm from '@/components/login/EmployeeLoginForm.vue'

const enterpriseStore = useEnterpriseStore()
const { t } = useI18n()

const logoUrl = computed(() => enterpriseStore.enterprise?.company_logo_url || logo)
const companyName = computed(() => enterpriseStore.enterprise?.company_name ?? '')
</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-5 pa-0">
      <v-col lg="5" md="6" sm="10" cols="12" class="pa-0">
        <v-sheet class="rounded-lg py-14 px-sm-12 px-5">
          <v-container class="mb-2">
            <v-row justify="center">
              <v-img max-width="160" :src="logoUrl" />
            </v-row>
            <v-row justify="center">
              <div class="my-3 text-h4 font-weight-bold text-center">
                {{ companyName }}
              </div>
            </v-row>
            <v-row justify="center">
              <h1 class="text-h5 font-weight-medium">{{ t('enterprise.login.title') }}</h1>
            </v-row>
          </v-container>

          <EmployeeLoginForm />
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
