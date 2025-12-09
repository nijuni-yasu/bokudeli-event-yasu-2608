<script setup lang="ts">
import { useNotification } from '@shokujii/base/composable/notification'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import { getRedirectPath } from '@shokujii/base/utils/redirect'
import { getHomePath, getUrlFromPath } from '@/router/utils'

const notification = useNotification()
const { t: $t } = useI18n()

const copyCurrentUrl = async () => {
  // getRedirectPath(false) でセッションストレージから削除せずに取得
  const url = getUrlFromPath(getRedirectPath(false) ?? getHomePath())
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      // クリップボードAPIが使えない環境向けのフォールバック実装
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (!ok) throw new Error('execCommand copy failed')
    }
    notification.show($t('login.inapp.copied'), 'success')
  } catch (e) {
    console.error(e)
    notification.show($t('login.inapp.copy_failed'), 'error')
  }
}
</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-5 pa-0">
      <v-col lg="5" md="6" sm="10" cols="12" class="pa-0">
        <v-sheet class="rounded-lg py-14 px-sm-12 px-5">
          <v-container class="mb-2">
            <v-row justify="center">
              <v-img max-width="100" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <div class="my-3 text-h4 font-weight-bold">{{ $t('login.inapp.notice_title') }}</div>
            </v-row>
            <v-row justify="center" class="py-5 text-subtitle-2">
              <div v-html="$t('login.inapp.notice_body')"></div>
            </v-row>
          </v-container>

          <v-btn size="large" color="grey-900" block @click="copyCurrentUrl">
            {{ $t('login.inapp.copy_url') }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
