import Vue from 'vue'
import {
  extend,
  ValidationObserver,
  ValidationProvider,
  localize,
} from 'vee-validate'
import {
  email,
  max,
  min,
  numeric,
  required,
  digits,
  max_value as maxValue,
  min_value as minValue,
} from 'vee-validate/dist/rules'
import ja from 'vee-validate/dist/locale/ja'

extend('email', email)
extend('max', max)
extend('min', min)
extend('numeric', numeric)
extend('required', required)
extend('digits', digits)
extend('max_value', maxValue)
extend('min_value', minValue)

Vue.component('validation-provider', ValidationProvider)
Vue.component('validation-observer', ValidationObserver)

// 表示されるメッセージを変更
ja.messages.digits = '{_field_}は{length}桁の半角数字でなければなりません'
ja.messages.max_value = '{_field_}は{max}円以下でなければなりません'
ja.messages.min_value = '{_field_}は{min}円以上でなければなりません'
ja.messages.numeric = '{_field_}は半角数字のみ使用できます'

localize('ja', ja)
// 日本語ローカライズの導入の参考情報
// https://qiita.com/sendaiharu1/items/b8a9fc03ff3e6de522a4
