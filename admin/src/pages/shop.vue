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
import { usePartnerStore, BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { useValidators } from '@shokujii/base/composable/validators.js'
import { getAuth } from 'firebase/auth'
import { GENRE_ARRAY } from '@shokujii/common/schemas/PartnerShop.js'
import ImageInput from '@shokujii/base/components/ImageInput.vue'
import { fetchLocationByPostalcode } from '@shokujii/base/composable/fetchLocation.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'

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
    const millis = start * 60 * 60 * 1000 + i * 15 * 60 * 1000
    const hour = `${Math.floor(millis / 60 / 60 / 1000)}`
    const minute = `${Math.floor((millis % (60 * 60 * 1000)) / 60 / 1000)}`.padStart(2, '0')
    return {
      title: `${hour}:${minute}`,
      value: millis,
    }
  })

const makeDeadlineCurrentDaytimeArray = (start: number, num: number) =>
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
  const timeArray = [...Array(num * 4)].map((_, i) => {
    const date = new Date(0)
    date.setHours(start + Math.floor(i / 4))
    date.setMinutes((i % 4) * 15)
    return { title: $d(date, 'time'), value: date.getTime() }
  })
  const endDate = new Date(0)
  endDate.setHours(start + num - 1)
  endDate.setMinutes(59)
  timeArray.push({ title: $d(endDate, 'time'), value: endDate.getTime() })
  return timeArray.reverse()
}

const SHOP_MIN_ORDERS_ARRAY_MAX = 15
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
// 配送範囲と最小注文数の配列の長さを保つための関数
const SHOP_RANGE_MIN_ORDERS_LIMIT = 5
const createEmptyRangeMinOrder = () =>
  ({ range: null, min_orders: null }) as unknown as BokudeliPartnerShop['shop_range_min_orders'][number]
const ensureRangeMinOrdersLength = (target?: BokudeliPartnerShop | null) => {
  if (target == null) {
    return
  }
  if (!Array.isArray(target.shop_range_min_orders)) {
    target.shop_range_min_orders = []
  }
  while (target.shop_range_min_orders.length < SHOP_RANGE_MIN_ORDERS_LIMIT) {
    target.shop_range_min_orders.push(createEmptyRangeMinOrder())
  }
  if (target.shop_range_min_orders.length > SHOP_RANGE_MIN_ORDERS_LIMIT) {
    target.shop_range_min_orders.splice(SHOP_RANGE_MIN_ORDERS_LIMIT)
  }
}
const SHOP_DEADLINE_DATE_ARRAY = [...Array(4)].map((_, i) => ({ title: $t('days_before', i), value: i }))
const SHOP_DEADLINE_TIME_ARRAY = makeDeadlineTimeArray(6, 18)
const SHOP_DEADLINE_CURRENT_DAY_TIME_ARRAY = makeDeadlineCurrentDaytimeArray(3, 4)
const shopDeadlineTimeArray = computed(() => {
  if (shop.value?.shop_deadline_datetime.days_before > 0) {
    return SHOP_DEADLINE_TIME_ARRAY
  } else {
    return SHOP_DEADLINE_CURRENT_DAY_TIME_ARRAY
  }
})

const deadlineDaysBefore = computed({
  get: () => shop.value?.shop_deadline_datetime.days_before,
  set: (value) => {
    if (shop.value?.shop_deadline_datetime) {
      shop.value.shop_deadline_datetime.days_before = value
      // days_beforeが変更されたときに時間を最大値に設定
      const timeValues = shopDeadlineTimeArray.value.map((item) => item.value)
      shop.value.shop_deadline_datetime.time = Math.max(...timeValues)
    }
  },
})

const SHOP_TIME_ARRAY1 = makeTimeArray(6, 72)
const SHOP_TIME_ARRAY2 = [{ value: null, title: '' }, ...makeTimeArray(6, 72)]

const partnerId = getAuth().currentUser?.uid ?? ''
const partnerStore = usePartnerStore(partnerId)

const shop = ref(
  await new Promise<BokudeliPartnerShop>((resolve) => {
    watch(
      () => partnerStore.shops,
      (shops) => {
        if (shops != null) {
          if (shops.length === 0) {
            const shop = new BokudeliPartnerShop(partnerId, null, {})
            shop.shop_email = getAuth().currentUser?.email ?? ''
            resolve(shop)
          } else {
            resolve(Object.assign(Object.create(Object.getPrototypeOf(shops[0])), shops[0]))
          }
          stop()
        }
      },
      { immediate: true },
    )
  }),
)
ensureRangeMinOrdersLength(shop.value)

const isSaving = ref(false)
const imageFile = ref<File | null>(null)

const isValid = ref(false)

// 郵便番号検証と位置情報取得の状態管理
const validatedPostalCode = ref<string | null>(null) // 位置情報取得に成功した郵便番号（成功時のみ値が入る）

// エラーダイアログの状態管理
const showPostalcodeErrorDialog = ref(false)
const postalcodeErrorMessage = ref<string>('')

// 郵便番号の連続入力時、古いリクエストが最新の値に影響しないようdebounceを適用
watchDebounced(
  () => shop.value?.shop_postcode,
  async (requestPostalCode) => {
    if (requestPostalCode == null) {
      return
    }

    // 必須チェックと郵便番号の形式チェック（7桁の数字）
    if (requiredValidator(requestPostalCode) !== true || postalCodeValidator(requestPostalCode) !== true) {
      shop.value.shop_address_base = ''
      return
    }

    // 検証済み郵便番号と緯度経度をリセット
    validatedPostalCode.value = null
    shop.value.shop_address_latitude = undefined
    shop.value.shop_address_longitude = undefined

    try {
      // 郵便番号から位置情報を取得（PostcodeJP API 呼び出し）
      const location = await fetchLocationByPostalcode(requestPostalCode)

      // レスポンスが返ってきた時点で、現在の郵便番号と一致するか確認
      // レースコンディション対策: 古いリクエストの結果を無視する
      if (shop.value.shop_postcode !== requestPostalCode) {
        return
      }

      // 位置情報が取得できなかった場合
      if (location?.address == null) {
        postalcodeErrorMessage.value = $t('shop.postalcode_error_not_found')
        showPostalcodeErrorDialog.value = true
        return
      }

      // 位置情報が取得できた場合、検証済み郵便番号と緯度経度を更新
      validatedPostalCode.value = requestPostalCode
      shop.value.shop_address_latitude = location.latitude
      shop.value.shop_address_longitude = location.longitude

      // 住所1（基本）を郵便番号APIの結果で設定
      shop.value.shop_address_base = location.address
    } catch (error) {
      // レスポンスが返ってきた時点で、現在の郵便番号と一致するか確認
      if (shop.value.shop_postcode !== requestPostalCode) {
        return // 既に別の郵便番号が入力されている場合は処理をスキップ
      }

      postalcodeErrorMessage.value = $t('shop.postalcode_error_fetch')
      showPostalcodeErrorDialog.value = true
      console.error('Error fetching postal code data:', error)
    }
  },
  { debounce: 500, immediate: true },
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
      shop.value.shop_url_twitter = url?.replace('https://x.com/', '')
    }
  },
  { immediate: true },
)

watch(
  () => shop.value?.shop_url_facebook,
  (url) => {
    if (url?.startsWith('https://www.facebook.com/') ?? false) {
      shop.value.shop_url_facebook = url?.replace('https://www.facebook.com/', '')
    }
  },
  { immediate: true },
)

watch(
  () => shop.value?.shop_url_instagram,
  (url) => {
    if (url?.startsWith('https://www.instagram.com/') ?? false) {
      shop.value.shop_url_instagram = url?.replace('https://www.instagram.com/', '')
    }
  },
  { immediate: true },
)

const handlePostalCodeErrorDialogOk = () => {
  if (shop.value != null) {
    shop.value.shop_postcode = ''
    shop.value.shop_address_base = ''
    shop.value.shop_address_detail = ''
  }
  showPostalcodeErrorDialog.value = false
}

const submit = async () => {
  isSaving.value = true
  try {
    await partnerStore.updateShop(toRaw(shop.value), imageFile.value ?? undefined)
    notification.show($t('shop.saved'), 'success')
  } catch (e) {
    console.error(e)
    notification.show($t('shop.save_error'), 'error')
  } finally {
    isSaving.value = false
  }
}

/**
 * 営業時間のバリデーション
 * ここで formRef をとるのはベストとは言えない
 * 本来なら別コンポーネントにするか UI そのものを修正すべき TODO
 */
const formRef = ref()
watch(
  () => shop.value.shop_time,
  () => {
    formRef.value?.validate()
  },
  { deep: true },
)

watch(
  () => shop.value.shop_range_min_orders,
  () => {
    formRef.value?.validate()
  },
  { deep: true },
)

// 終了時刻が開始時刻より後になっているかどうかをバリデーション
const shopEndTimeValidator = (isOpen: boolean, time_start: number | null, time_end: number | null) =>
  isOpen && time_start != null && time_end != null && time_end <= time_start ? $t('shop.time_end_after_start') : true

// 第2部の開始時刻が第1部の終了時刻より後になっているかどうかをバリデーション
const shopStartTime2Validator = (isOpen: boolean, time_end: number | null, time_start2: number | null) =>
  isOpen && time_end != null && time_start2 != null && time_start2 <= time_end ? $t('shop.time_start2_after_end') : true

// 第2部の開始時刻と終了時刻が両方入力されているかどうかをバリデーション
// currentValue: 現在のフィールドの値、otherValue: もう一方のフィールドの値
const shopTime2PairValidator = (isOpen: boolean, otherValue: number | null) => (currentValue: number | null) =>
  isOpen && currentValue == null && otherValue != null ? $t('shop.time2_pair_required') : true

// 配送距離と注文最小個数が両方入力されているかどうかをバリデーション
const shopRangePairValidator = (min_orders: number | null, range: number | null) =>
  range == null && min_orders != null ? $t('shop.range_min_orders_pair_required') : true

const minOrdersPairValidator = (range: number | null, min_orders: number | null) =>
  min_orders == null && range != null ? $t('shop.range_min_orders_pair_required') : true
</script>

<template>
  <v-form v-model="isValid" @submit.prevent="submit" ref="formRef">
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
              v-model="shop.shop_address_base"
              outlined
              dense
              readonly
              :label="$t('address')"
              :hint="$t('address_hint')"
              persistent-hint
              :rules="[requiredValidator]"
            />
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="shop.shop_address_detail"
              outlined
              dense
              :label="$t('detail_address')"
              :hint="$t('detail_address_hint')"
              persistent-hint
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
                  :rules="[shopRangePairValidator.bind(null, shop.shop_range_min_orders[i - 1].min_orders)]"
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
                  :rules="[minOrdersPairValidator.bind(null, shop.shop_range_min_orders[i - 1].range)]"
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
          <v-card-text v-for="(item, i) of shop.shop_time" :key="`shop_time_${i}`" class="mt-6">
            <!-- 1行目: v-switch(2) + 第1部(開始/終了) -->
            <v-row class="align-start mb-2">
              <v-col cols="12" sm="3">
                <v-switch v-model="item.is_open" :label="dayOfWeek[i]" />
              </v-col>

              <v-col cols="12" sm="4">
                <v-select
                  v-model="item.time_start"
                  :disabled="!item.is_open"
                  :items="SHOP_TIME_ARRAY1"
                  outlined
                  dense
                  :label="$t('shop.time_start', ['1'])"
                />
              </v-col>

              <v-col cols="12" sm="4">
                <v-select
                  v-model="item.time_end"
                  :disabled="!item.is_open"
                  :items="SHOP_TIME_ARRAY1"
                  outlined
                  dense
                  :label="$t('shop.time_end', ['1'])"
                  :rules="[shopEndTimeValidator.bind(null, item.is_open, item.time_start)]"
                />
              </v-col>
            </v-row>

            <!-- 2行目: オフセット(2) + 第2部(開始/終了) -->
            <v-row class="align-start">
              <v-col cols="12" sm="3">
                <!-- 2行目は見た目上のオフセットだけなので空 -->
              </v-col>

              <v-col cols="12" sm="4">
                <v-select
                  v-model="item.time_start2"
                  :disabled="!item.is_open"
                  :items="SHOP_TIME_ARRAY2"
                  outlined
                  dense
                  :label="$t('shop.time_start', ['2'])"
                  :rules="[
                    shopStartTime2Validator.bind(null, item.is_open, item.time_end),
                    shopTime2PairValidator(item.is_open, item.time_end2),
                  ]"
                />
              </v-col>

              <v-col cols="12" sm="4">
                <v-select
                  v-model="item.time_end2"
                  :disabled="!item.is_open"
                  :items="SHOP_TIME_ARRAY2"
                  outlined
                  dense
                  :label="$t('shop.time_end', ['2'])"
                  :rules="[
                    shopEndTimeValidator.bind(null, item.is_open, item.time_start2),
                    shopTime2PairValidator(item.is_open, item.time_start2),
                  ]"
                />
              </v-col>
            </v-row>
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
                  v-model="deadlineDaysBefore"
                  :items="SHOP_DEADLINE_DATE_ARRAY"
                  outlined
                  dense
                  :label="$t('shop.deadline_date')"
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
          <v-card-text>
            <v-text-field
              v-model="shop['shop_email_sub1']"
              outlined
              dense
              :label="$t('shop.email_sub_n', [1])"
              :rules="[emailValidator]"
            />
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="shop['shop_email_sub2']"
              outlined
              dense
              :label="$t('shop.email_sub_n', [2])"
              :rules="[emailValidator]"
            />
          </v-card-text>
          <v-card-text>
            <v-text-field
              v-model="shop['shop_email_sub3']"
              outlined
              dense
              :label="$t('shop.email_sub_n', [3])"
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

  <!-- エラーダイアログ -->
  <ConfirmDialog
    v-model="showPostalcodeErrorDialog"
    :title="$t('shop.postalcode_error_title')"
    ok-text="OK"
    :ok-click="handlePostalCodeErrorDialogOk"
  >
    {{ postalcodeErrorMessage }}
  </ConfirmDialog>
</template>
<style lang="css" scoped>
.hint-text {
  font-size: 13px;
  margin-left: 10px;
  margin-bottom: 10px;
}
</style>
