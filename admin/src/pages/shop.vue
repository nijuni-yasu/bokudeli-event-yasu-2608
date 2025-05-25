<script setup lang="ts">
import {
  mdiStorefrontOutline,
  mdiFileImageOutline,
  mdiEarth,
  mdiBicycle,
  mdiClockOutline,
  mdiClockFast,
  mdiEmailMultipleOutline,
  mdiFileDocumentOutline,
} from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { usePartnerStore } from '@/stores/partner'
import { useValidators } from '@/composable/validators'
import { getAuth } from 'firebase/auth'
import { Shop, GENRE_ARRAY } from '@/schemes/shop'
import ImageInput from '@/components/ImageInput.vue'
import { fetchLocationByPostalcode } from '@/composable/fetchLocation'
import { useNotification } from '@/composable/notification'

const notification = useNotification()

const { t: $t, tm: $tm, d: $d } = useI18n()
const dayOfWeek = $tm('day_of_week') as {
  [key: number]: string // or whatever the correct type is
}

const {
  requiredValidator,
  postalCodeValidator,
  phoneValidator,
  maxLengthValidator,
  emailValidator,
  invoiceValidatorJapan,
} = useValidators()

const makeTimeArray = (start: number, num: number) =>
  [...Array(num)].map((_, i) => {
    const date = new Date(0)
    date.setHours(start + Math.floor(i / 4))
    date.setMinutes((i % 4) * 15)
    return { title: $d(date, 'time'), value: date.getTime() }
  })

const makeDeadlineCurrenDaytimeArray = (start: number, num: number) =>
  [...Array(num)]
    .map((_, i) => {
      const date = new Date(0)
      const hours = start + i
      date.setHours(hours)
      date.setMinutes(0)
      return { title: $t('shop.deadline_before_time', [hours]), value: hours * 60 * 60 * 1000 }
    })
    .reverse()

const makeDeadlineTimeArray = (start: number, num: number) => {
  const timeArray = [...Array(num)].map((_, i) => {
    const date = new Date(0)
    date.setHours(start + i)
    date.setMinutes(0)
    return { title: $d(date, 'time'), value: date.getTime() }
  })
  const endDate = new Date(0)
  endDate.setHours(start + num - 1)
  endDate.setMinutes(59)
  timeArray.push({ title: $d(endDate, 'time'), value: endDate.getTime() })
  return timeArray.reverse()
}

const SHOP_MIN_ORDERS_ARRAY_MAX = 20
const SHOP_MIN_ORDERS_ARRAY = [null, ...[...Array(SHOP_MIN_ORDERS_ARRAY_MAX)].map((_, i) => i + 1)]
const SHOP_RANGE_ARRAY_MAX = 50
const SHOP_RANGE_ARRAY = (() => {
  const array: (number | null)[] = [null]
  let i = 0.5
  while (i <= SHOP_RANGE_ARRAY_MAX) {
    array.push(i)
    i += i < 10 ? 0.5 : 1
  }
  return array
})()
const SHOP_DEADLINE_DATE_ARRAY = [...Array(4)].map((_, i) => ({ title: $t('days_before', i), value: i }))
const SHOP_DEADLINE_TIME_ARRAY = makeDeadlineTimeArray(0, 24)
const SHOP_DEADLINE_CURRENT_DAY_TIME_ARRAY = makeDeadlineCurrenDaytimeArray(3, 4)
const shopDeadlineTimeArray = computed(() => {
  if (shop.value?.shop_deadline_datetime.days_before > 0) {
    return SHOP_DEADLINE_TIME_ARRAY
  } else {
    return SHOP_DEADLINE_CURRENT_DAY_TIME_ARRAY
  }
})
const onDeadlineDaysBeforeChange = () => {
  if (shop.value?.shop_deadline_datetime == null) {
    return
  }
  const timeValues = shopDeadlineTimeArray.value.map((item) => item.value)
  shop.value.shop_deadline_datetime.time = Math.max(...timeValues)
}
const SHOP_TIME_ARRAY = ['', ...makeTimeArray(6, 73)]

const partnerId = getAuth().currentUser?.uid ?? ''
const partnerStore = usePartnerStore(partnerId)

const shop = ref(
  await new Promise<Shop>((resolve) => {
    watch(
      () => partnerStore.shops,
      (shops) => {
        if (shops != null) {
          if (shops.length === 0) {
            const shop = new Shop(partnerId)
            shop.shop_email = getAuth().currentUser?.email ?? ''
            resolve(shop)
          } else {
            resolve(Object.assign({}, toRaw(shops[0])))
          }
          stop()
        }
      },
      { immediate: true },
    )
  }),
)

const isSaving = ref(false)
const imageFile = ref<File | null>(null)

const isValid = ref(false)

const validatedPostalCode = ref<string | null>(null)
watch(
  () => shop.value?.shop_postcode,
  async () => {
    if (shop.value == null) {
      return
    }
    const postalcode = shop.value.shop_postcode
    if (requiredValidator(postalcode) !== true || postalCodeValidator(postalcode) !== true) {
      validatedPostalCode.value = null
      return
    }
    const location = await fetchLocationByPostalcode(postalcode as string)
    if (location?.address == null) {
      validatedPostalCode.value = null
      return
    }
    validatedPostalCode.value = postalcode
    if (shop.value.shop_address?.startsWith(location.address) ?? false) {
      return
    }
    shop.value.shop_address_latitude = location.latitude
    shop.value.shop_address_longitude = location.longitude
    shop.value.shop_address = location.address
  },
  { immediate: true },
)

const hasInvoice = computed({
  get: () => shop.value?.shop_invoice_number != null,
  set: (value) => {
    if (value) {
      shop.value.shop_invoice_number = ''
    } else {
      delete shop.value.shop_invoice_number
    }
  },
})

watch(
  () => shop.value?.shop_url_twitter,
  (url) => {
    if (url?.startsWith('https://x.com/') ?? false) {
      shop.value.shop_url_twitter = url.replace('https://x.com/', '')
    }
  },
  { immediate: true },
)

watch(
  () => shop.value?.shop_url_facebook,
  (url) => {
    if (url?.startsWith('https://www.facebook.com/') ?? false) {
      shop.value.shop_url_facebook = url.replace('https://www.facebook.com/', '')
    }
  },
  { immediate: true },
)

watch(
  () => shop.value?.shop_url_instagram,
  (url) => {
    if (url?.startsWith('https://www.instagram.com/') ?? false) {
      shop.value.shop_url_instagram = url.replace('https://www.instagram.com/', '')
    }
  },
  { immediate: true },
)

const submit = async () => {
  isSaving.value = true
  try {
    await partnerStore.updateShop(shop.value, imageFile.value ?? undefined)
    notification.show($t('shop.saved'), 'success')
  } catch (e) {
    console.error(e)
    notification.show($t('shop.save_error'), 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <v-form v-model="isValid" @submit.prevent="submit">
    <v-row class="justify-center">
      <v-col cols="12" sm="12" md="9" class="px-0">
        <v-card class="mb-10" flat>
          <template v-slot:title>
            <v-icon size="40" class="text--primary me-3" :icon="mdiStorefrontOutline" />
            <span>{{ $t('shop.info') }}</span>
          </template>
          <v-card-text>
            <v-text-field
              v-model="shop.shop_name"
              outlined
              dense
              :label="$t('shop.name')"
              :rules="[requiredValidator]"
            />
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="shop.shop_postcode"
              outlined
              dense
              :label="$t('postal_code')"
              :rules="[requiredValidator, postalCodeValidator]"
            />
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="shop.shop_address"
              outlined
              dense
              :label="$t('address')"
              :rules="[requiredValidator]"
            />
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="shop.shop_phone"
              outlined
              dense
              :label="$t('phone_number')"
              :rules="[requiredValidator, phoneValidator]"
            />
          </v-card-text>
          <v-card-text>
            <v-select
              v-model="shop.shop_genre"
              :items="GENRE_ARRAY"
              outlined
              dense
              :label="$t('shop.genre')"
              :rules="[requiredValidator]"
            />
          </v-card-text>
          <v-card-text>
            <v-textarea
              v-model="shop.shop_description"
              outlined
              dense
              :label="$t('shop.description')"
              :rules="[requiredValidator, (v: string) => maxLengthValidator(v, 300)]"
            />
          </v-card-text>
          <v-card-text>
            <v-text-field v-model="shop.shop_url" outlined dense :label="$t('shop.url')" :hint="$t('shop.url_hint')" />
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="shop.shop_url_twitter"
              outlined
              dense
              :label="$t('shop.url_twitter')"
              :hint="$t('shop.url_twitter_hint')"
              prefix="https://x.com/"
            />
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="shop.shop_url_facebook"
              outlined
              dense
              :label="$t('shop.url_facebook')"
              :hint="$t('shop.url_facebook_hint')"
              prefix="https://www.facebook.com/"
            />
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="shop.shop_url_instagram"
              outlined
              dense
              :label="$t('shop.url_instagram')"
              :hint="$t('shop.url_instagram_hint')"
              prefix="https://www.instagram.com/"
            />
          </v-card-text>
          <v-card-text>
            <v-btn type="submit" :disabled="!isValid" :loading="isSaving">{{ $t('shop.submit') }}</v-btn>
          </v-card-text>
        </v-card>
        <v-card class="my-10" flat>
          <template v-slot:title>
            <v-icon size="40" class="text--primary me-3" :icon="mdiFileImageOutline" />
            <span>{{ $t('shop.image') }}</span>
          </template>
          <v-card-text class="hint-text">
            <ImageInput
              :url="shop.shop_image_url ?? undefined"
              :rules="[requiredValidator]"
              style="width: 100%; aspect-ratio: 120/63"
              :cover="true"
              @fileSelected="(f) => (imageFile = f)"
            />
            {{ $t('shop.image_hint') }}
          </v-card-text>
          <v-card-text>
            <v-btn type="submit" :disabled="!isValid" :loading="isSaving">{{ $t('shop.submit') }}</v-btn>
          </v-card-text>
        </v-card>
        <v-card v-if="validatedPostalCode != null" class="my-10" flat>
          <template v-slot:title>
            <v-icon size="40" class="text--primary me-3" :icon="mdiEarth" />
            <span>{{ $t('shop.base_point') }}</span>
          </template>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-text-field v-model="shop.shop_address_latitude" outlined dense readonly :label="$t('latitude')" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="shop.shop_address_longitude" outlined dense readonly :label="$t('longitude')" />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-text class="hint-text">
            <div v-html="$t('shop.base_point_hint', [validatedPostalCode])"></div>
          </v-card-text>
        </v-card>
        <v-card class="my-10" flat>
          <template v-slot:title>
            <v-icon size="40" class="text--primary me-3" :icon="mdiBicycle" />
            <span>{{ $t('shop.range_min_orders') }}</span>
          </template>
          <v-card-text v-for="i in 5" :key="`range_${i}`">
            <v-row v-if="shop.shop_range_min_orders[i - 1]">
              <v-col cols="6">
                <!-- TODO v-select の items を動的に切り替える UI がここに適しているかは再検討の必要あり -->
                <v-select
                  v-model="shop.shop_range_min_orders[i - 1].range"
                  :items="
                    SHOP_RANGE_ARRAY.filter((v) => {
                      if (v == null) {
                        return (
                          shop.shop_range_min_orders[i]?.range == null &&
                          shop.shop_range_min_orders[i]?.min_orders == null
                        )
                      }
                      return (
                        v > (shop.shop_range_min_orders[i - 2]?.range ?? 0) &&
                        v < (shop.shop_range_min_orders[i]?.range ?? Number.MAX_SAFE_INTEGER)
                      )
                    })
                  "
                  outlined
                  dense
                  :label="$t('shop.range')"
                  :disabled="
                    i !== 1 &&
                    (shop.shop_range_min_orders[i - 2]?.range == null ||
                      shop.shop_range_min_orders[i - 2].range == SHOP_RANGE_ARRAY_MAX ||
                      shop.shop_range_min_orders[i - 2]?.min_orders == null ||
                      shop.shop_range_min_orders[i - 2].min_orders == SHOP_MIN_ORDERS_ARRAY_MAX)
                  "
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="shop.shop_range_min_orders[i - 1].min_orders"
                  :items="
                    SHOP_MIN_ORDERS_ARRAY.filter((v) => {
                      if (v == null) {
                        return (
                          shop.shop_range_min_orders[i]?.range == null &&
                          shop.shop_range_min_orders[i]?.min_orders == null
                        )
                      }
                      return (
                        v > (shop.shop_range_min_orders[i - 2]?.min_orders ?? 0) &&
                        v < (shop.shop_range_min_orders[i]?.min_orders ?? Number.MAX_SAFE_INTEGER)
                      )
                    })
                  "
                  outlined
                  dense
                  :label="$t('shop.min_orders')"
                  :disabled="
                    i !== 1 &&
                    (shop.shop_range_min_orders[i - 2]?.range == null ||
                      shop.shop_range_min_orders[i - 2].range == SHOP_RANGE_ARRAY_MAX ||
                      shop.shop_range_min_orders[i - 2]?.min_orders == null ||
                      shop.shop_range_min_orders[i - 2].min_orders == SHOP_MIN_ORDERS_ARRAY_MAX)
                  "
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-text class="hint-text">
            <div v-html="$t('shop.range_min_orders_hint')"></div>
          </v-card-text>
          <v-card-text>
            <v-btn type="submit" :disabled="!isValid" :loading="isSaving">{{ $t('shop.submit') }}</v-btn>
          </v-card-text>
        </v-card>
        <v-card class="my-10" flat>
          <template v-slot:title>
            <v-icon size="40" class="text--primary me-3" :icon="mdiClockOutline" />
            <span>{{ $t('shop.time') }}</span>
          </template>
          <v-card-text v-for="(item, i) of shop.shop_time" :key="`shop_time_${i}`">
            <v-table>
              <tr>
                <td style="padding: 12px"><v-switch v-model="item.is_open" :label="dayOfWeek[i]" /></td>
                <td style="padding: 12px">
                  <v-select
                    v-model="item.time_start"
                    :disabled="!item.is_open"
                    :items="SHOP_TIME_ARRAY"
                    outlined
                    dense
                    :label="$t('shop.time_start', ['1'])"
                  />
                </td>
                <td style="padding: 12px">
                  <v-select
                    v-model="item.time_end"
                    :disabled="!item.is_open"
                    :items="SHOP_TIME_ARRAY"
                    outlined
                    dense
                    :label="$t('shop.time_end', ['1'])"
                  />
                </td>
              </tr>
              <tr>
                <td></td>
                <td style="padding: 12px">
                  <v-select
                    v-model="item.time_start2"
                    :disabled="!item.is_open"
                    :items="SHOP_TIME_ARRAY"
                    outlined
                    dense
                    :label="$t('shop.time_start', ['2'])"
                  />
                </td>
                <td style="padding: 12px">
                  <v-select
                    v-model="item.time_end2"
                    :disabled="!item.is_open"
                    :items="SHOP_TIME_ARRAY"
                    outlined
                    dense
                    :label="$t('shop.time_end', ['2'])"
                  />
                </td>
              </tr>
            </v-table>
          </v-card-text>
          <v-card-text class="hint-text">
            <div v-html="$t('shop.time_hint')"></div>
          </v-card-text>
          <v-card-text>
            <v-btn type="submit" :disabled="!isValid" :loading="isSaving">{{ $t('shop.submit') }}</v-btn>
          </v-card-text>
        </v-card>
        <v-card class="my-10" flat>
          <template v-slot:title>
            <v-icon size="40" class="text--primary me-3" :icon="mdiClockFast" />
            <span>{{ $t('shop.deadline_datetime') }}</span>
          </template>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="shop.shop_deadline_datetime.days_before"
                  :items="SHOP_DEADLINE_DATE_ARRAY"
                  outlined
                  dense
                  :label="$t('shop.deadline_date')"
                  @update:modelValue="onDeadlineDaysBeforeChange"
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="shop.shop_deadline_datetime.time"
                  :items="shopDeadlineTimeArray"
                  outlined
                  dense
                  :label="$t('shop.deadline_time')"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-text class="hint-text">
            <div v-html="$t('shop.deadline_hint')"></div>
          </v-card-text>
          <v-card-text>
            <v-btn type="submit" :disabled="!isValid" :loading="isSaving">{{ $t('shop.submit') }}</v-btn>
          </v-card-text>
        </v-card>
        <v-card class="my-10" flat>
          <template v-slot:title>
            <v-icon size="40" class="text--primary me-3" :icon="mdiEmailMultipleOutline" />
            <span>{{ $t('shop.email_sub') }}</span>
          </template>
          <v-card-text>
            <v-text-field v-model="shop.shop_email" readonly outlined dense :label="$t('email')" />
          </v-card-text>
          <v-card-text v-for="i in 3" :key="`sub_email_${i}`">
            <v-text-field
              v-model="/* @ts-ignore */ shop[`shop_email_sub${i}`]"
              outlined
              dense
              :label="$t('shop.email_sub_n', [i])"
              :rules="[emailValidator]"
            />
          </v-card-text>
          <v-card-text class="hint-text">
            <div v-html="$t('shop.email_sub_hint')"></div>
          </v-card-text>
          <v-card-text>
            <v-btn type="submit" :disabled="!isValid" :loading="isSaving">{{ $t('shop.submit') }}</v-btn>
          </v-card-text>
        </v-card>
        <v-card class="my-10" flat>
          <template v-slot:title>
            <v-icon size="40" class="text--primary me-3" :icon="mdiFileDocumentOutline" />
            <span>{{ $t('shop.invoice') }}</span>
          </template>
          <v-card-text>
            <v-switch v-model="hasInvoice" :label="`${hasInvoice ? $t('shop.has_invoice') : $t('shop.no_invoice')}`" />
            <v-text-field
              class="mt-3"
              :key="hasInvoice ? 'hasInvoice' : 'noInvoice'"
              v-model="shop.shop_invoice_number"
              outlined
              dense
              :disabled="!hasInvoice"
              :label="$t('invoice_number')"
              :rules="hasInvoice ? [invoiceValidatorJapan, requiredValidator] : [invoiceValidatorJapan]"
            />
          </v-card-text>
          <v-card-text class="hint-text">
            <div v-html="$t('shop.invoice_hint')"></div>
          </v-card-text>
          <v-card-text>
            <v-btn type="submit" :disabled="!isValid" :loading="isSaving">{{ $t('shop.submit') }}</v-btn>
          </v-card-text>
        </v-card>
        <v-card class="mt-2" flat>
          <template v-slot:title>
            <v-icon size="40" class="text--primary me-3" :icon="mdiStorefrontOutline" />
            <span>{{ $t('shop.is_open') }}</span>
          </template>
          <v-card-text>
            <v-switch
              v-model="shop.is_open"
              :label="`${shop.is_open ? $t('shop.label_open') : $t('shop.label_close')}`"
            />
          </v-card-text>
          <v-card-text class="hint-text">
            <div v-html="$t('shop.is_open_hint')"></div>
          </v-card-text>
          <v-card-text>
            <v-btn type="submit" :disabled="!isValid" :loading="isSaving">{{ $t('shop.submit') }}</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-form>
</template>
<style lang="css" scoped>
.hint-text {
  font-size: 13px;
  margin-left: 10px;
  margin-bottom: 10px;
}
</style>
