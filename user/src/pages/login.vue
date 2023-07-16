<script setup lang="ts">
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import yoroshiku from '@/assets/images/bokudeli/bokudeli_yoroshiku.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

import { useCookies } from '@vueuse/integrations/useCookies'

import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/auth-v2-mask-dark.png'
import authV2MaskLight from '@images/pages/auth-v2-mask-light.png'

const form = ref({
  username: '',
  password: '',
})
const isPasswordVisible = ref(false)

const cookies = useCookies(['isLogin'])
const router = useRouter()

const validUserAndPassword = {
  username: import.meta.env.VITE_LOGIN_USERNAME,
  password: import.meta.env.VITE_LOGIN_PASSWORD,
}

const authThemeImg = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const checkForm = () => {
  const { username, password } = form.value
  const { username: validUsername, password: validPassword } = validUserAndPassword

  if (username === validUsername && password === validPassword) {
    cookies.set('isLogin', 'true', {
      maxAge: 60 * 60 * 24 * 2, // 2day
    })
    router.push({ path: '/' })
  } else {
    alert('ユーザー名またはパスワードが違います')
  }
}
</script>

<template>
  <div>
    <!-- Title and Logo -->
    <div class="auth-logo d-flex align-start gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
    </div>

    <VRow no-gutters class="auth-wrapper">
      <VCol md="8" class="d-flex align-center justify-center">
        <div class="d-flex align-center justify-center w-100 mt-10 pt-10">
          <VImg max-width="400px" :src="yoroshiku"/>
          <div  width="400px" class="ma-3 text-h6">
            こんにちは😊<br>
            いつもぼくデリのご利用をありがうございます。<br>
            『ぼくデリWEB版』は一般公開前のサービスです。<br>
            友達に教えたりSNS投稿はまだしないでください。<br>
            よろしくお願いします！<br>
          </div>
        </div>
      </VCol>
      <VCol cols="12" md="4" class="auth-card-v2 d-flex align-center justify-center">
        <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-4">
          <VCardText>
            <h5 class="text-h5 font-weight-medium mb-1">Welcome to {{ themeConfig.app.title }} 👋🏻</h5>
          </VCardText>
          <VCardText>
            <VForm>
              <VRow>
                <!-- user -->
                <VCol cols="12">
                  <VTextField v-model="form.username" label="ユーザー名" />
                </VCol>

                <!-- password -->
                <VCol cols="12">
                  <VTextField
                    v-model="form.password"
                    label="パスワード"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  />
                  <VBtn class="mt-4" block @click="checkForm">ログイン</VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style lang="scss">
@use '@core/scss/template/pages/page-auth.scss';
</style>

<route lang="yaml">
meta:
  layout: blank
</route>
