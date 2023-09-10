import { createApp } from 'vue'
import { StripeCheckout } from '@vue-stripe/vue-stripe'

createApp({}).component('StripeCheckout', StripeCheckout).mount('#app')
