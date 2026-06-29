<script setup lang="ts">
import { getEnterpriseLogoStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { uploadImage, convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { updateEnterpriseSettings } from '@/apis/enterprise'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AdminReadonlyItem from '@/components/admin/AdminReadonlyItem.vue'
import AdminReadonlySection from '@/components/admin/AdminReadonlySection.vue'
import { getEnterpriseIdFromToken, loadEnterpriseDocument } from '@/composable/useEnterpriseAdmin'
import { useEnterpriseStore } from '@/stores/enterprise'

const { t } = useI18n()
const notification = useNotification()
const enterpriseStore = useEnterpriseStore()

const loading = ref(true)
const saving = ref(false)
const enterpriseId = ref<string | undefined>()
const companyName = ref('')
const companyLogoUrl = ref('')
const themeColor = ref('#1976D2')
const subdomain = ref('')
const customDomain = ref<string | undefined>()
const allowedEmailDomains = ref<string[]>([])
const logoFile = ref<File | null>(null)
const logoPreviewUrl = ref('')

const baseDomain = import.meta.env.VITE_ENTERPRISE_BASE_DOMAIN ?? 'shokujii.com'

const customDomainDisplay = computed(() =>
  customDomain.value != null && customDomain.value !== '' ? customDomain.value : t('admin.common.not_set'),
)

const allowedDomainsDisplay = computed(() =>
  allowedEmailDomains.value.length > 0 ? allowedEmailDomains.value.join(', ') : t('admin.common.not_set'),
)

const loadSettings = async () => {
  loading.value = true
  try {
    enterpriseId.value = await getEnterpriseIdFromToken()
    if (enterpriseId.value == null) return
    const doc = await loadEnterpriseDocument(enterpriseId.value)
    if (doc == null) return
    companyName.value = doc.company_name
    companyLogoUrl.value = doc.company_logo_url
    logoPreviewUrl.value = doc.company_logo_url
    themeColor.value = doc.theme_color
    subdomain.value = doc.subdomain
    customDomain.value = doc.custom_domain
    allowedEmailDomains.value = doc.allowed_email_domains
  } finally {
    loading.value = false
  }
}

onMounted(loadSettings)

const handleLogoSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file == null) return
  if (file.size > 2 * 1024 * 1024) {
    notification.show(t('admin.settings.logo_size_error'), 'error')
    return
  }
  if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
    notification.show(t('admin.settings.logo_type_error'), 'error')
    return
  }
  logoFile.value = file
  logoPreviewUrl.value = URL.createObjectURL(file)
}

const saveSettings = async () => {
  if (enterpriseId.value == null) return
  if (companyName.value.trim() === '') {
    notification.show(t('admin.settings.company_name_required'), 'error')
    return
  }

  saving.value = true
  try {
    let logoUrl = companyLogoUrl.value
    if (logoFile.value != null) {
      const path = getEnterpriseLogoStoragePath(enterpriseId.value)
      await uploadImage(logoFile.value, path)
      logoUrl = convertStoragePathToURL(path)
    }

    await updateEnterpriseSettings({
      enterprise_id: enterpriseId.value,
      company_name: companyName.value.trim(),
      company_logo_url: logoFile.value != null ? logoUrl : undefined,
    })

    companyLogoUrl.value = logoUrl
    logoFile.value = null
    await enterpriseStore.resolveEnterprise()
    notification.show(t('admin.settings.save_success'), 'success')
  } catch {
    notification.show(t('admin.settings.save_failed'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container>
    <AdminPageHeader :title="$t('admin.settings.title')" :description="$t('admin.settings.page_description')" />

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-card v-else>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="8">
            <div class="d-flex flex-column ga-6">
              <div>
                <div class="text-subtitle-1 mb-3">{{ $t('admin.settings.section_basic') }}</div>
                <div class="d-flex flex-column ga-4">
                  <v-text-field
                    v-model="companyName"
                    :label="$t('admin.settings.company_name')"
                    maxlength="100"
                    counter="100"
                  />

                  <div>
                    <div class="text-body-2 mb-2">{{ $t('admin.settings.logo') }}</div>
                    <p class="text-caption text-medium-emphasis mb-2">{{ $t('admin.settings.logo_hint') }}</p>
                    <v-img
                      v-if="logoPreviewUrl"
                      :src="logoPreviewUrl"
                      :alt="$t('admin.settings.logo')"
                      max-width="120"
                      max-height="120"
                      class="mb-3"
                    />
                    <v-btn variant="outlined" @click="($refs.logoInput as HTMLInputElement)?.click()">
                      {{ $t('admin.settings.logo_select') }}
                    </v-btn>
                    <input
                      ref="logoInput"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      hidden
                      @change="handleLogoSelect"
                    />
                  </div>
                </div>
              </div>

              <v-divider />

              <AdminReadonlySection :title="$t('admin.settings.section_appearance')">
                <div class="d-flex align-center ga-3 mb-2">
                  <div
                    :style="{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: themeColor }"
                    :aria-label="$t('admin.settings.theme_color')"
                  />
                  <span class="text-medium-emphasis">{{ $t('admin.settings.theme_color_readonly') }}</span>
                </div>
              </AdminReadonlySection>

              <v-divider />

              <AdminReadonlySection :title="$t('admin.settings.section_domain')">
                <AdminReadonlyItem :label="$t('admin.settings.subdomain')" :value="`${subdomain}.${baseDomain}`" />
                <AdminReadonlyItem :label="$t('admin.settings.custom_domain')" :value="customDomainDisplay" />
              </AdminReadonlySection>

              <v-divider />

              <AdminReadonlySection :title="$t('admin.settings.section_auth')">
                <AdminReadonlyItem :label="$t('admin.settings.allowed_domains')" :value="allowedDomainsDisplay" />
              </AdminReadonlySection>

              <v-divider />

              <AdminReadonlySection :title="$t('admin.settings.section_payment')">
                <AdminReadonlyItem
                  :label="$t('admin.settings.default_payment_label')"
                  :value="$t('admin.settings.default_payment')"
                />
                <p class="text-caption text-medium-emphasis mt-1 mb-0">
                  {{ $t('admin.settings.default_payment_hint') }}
                </p>
              </AdminReadonlySection>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" :loading="saving" @click="saveSettings">{{ $t('admin.settings.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: admin
</route>
