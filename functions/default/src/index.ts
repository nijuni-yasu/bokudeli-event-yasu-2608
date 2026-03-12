Object.defineProperty(globalThis, 'IS_SERVER', {
  value: true,
  writable: false, // 値を変更不可にする
  configurable: false, // 再定義を防ぐ
})

// https://firebase.google.com/docs/functions/typescript
import { setGlobalOptions } from 'firebase-functions/v2/options'
import { initializeApp } from 'firebase-admin/app'

initializeApp()
setGlobalOptions({ region: 'asia-northeast1' })

// ES module 形式の import は並列読み込みのため、initializeApp 等の呼び出しが先に行われることを保証できない
// そのため、ここでは 動的 import を使い、静的 import より後に実行されることを保証する
/* prettier-ignore */ // 各行とファイルを対応させるため
export const {
  getInvitationUrlForCommunityManager, acceptInvitationForCommunityManager,
  sendTestLetter,
  handleEventOgpRequest, handleCommunityOgpRequest,
  communityAdded, communityContact,
  createStripeCheckoutSession, stripeWebhook, stripeRefunds,
  eventInformation, eventInformationPreview,
  shopStatusChanged,
  onOrderChanged,
  onEventChanged,
  onShopReservationChanged,
  pollingTask,
  requestEmailLogin, confirmEmailLogin, requestEmailChange, confirmEmailChange, updateProfileFromProviders,
  addOrder, updateMenuCountInCart, deleteMenuInCart, updateOrderStatus,
  eventReceipt,
  eventCopy,
  eventBillInvoice,
  updateEventMenus,
} = Object.assign({}, ...(await Promise.all([
  import('./communityManager.js'),
  import('./letter.js'),
  import('./ogpRequest.js'),
  import('./communityMail.js'),
  import('./stripe.js'), import('./stripeWebhook.js'), import('./stripeRefunds.js'),
  import('./eventInformationMail.js'),
  import('./shopOpen.js'),
  import('./orderCompletionMail.js'),
  import('./eventStatusChangeMail.js'),
  import('./eventMenusSnapshot.js'),
  import('./pollingTask.js'),
  import('./user.js'),
  import('./orders.js'),
  import('./eventReceipt.js'),
  import('./eventCopy.js'),
  import('./eventBillInvoice.js'),
  import('./eventMenusSelection.js'),
])))
