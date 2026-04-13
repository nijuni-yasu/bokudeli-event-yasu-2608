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
  createStripeCheckoutSession, stripeWebhook, cancelOrders,
  eventInformation, eventInformationPreview,
  shopStatusChanged,
  onEventChanged,
  onShopReservationChanged,
  pollingTask,
  requestEmailLogin, confirmEmailLogin, requestEmailChange, confirmEmailChange, updateProfileFromProviders,
  deleteUserAccount,
  addToCart, removeFromCart, confirmOrder,
  createEventMembers,
  eventReceipt,
  eventCopy,
  eventBillInvoice,
  updateEventMenus,
  sendIndividualLetter,
  generateUserImageThumbnail,
} = Object.assign({}, ...(await Promise.all([
  import('./communityManager.js'),
  import('./letter.js'),
  import('./ogpRequest.js'),
  import('./communityMail.js'),
  import('./stripe.js'), import('./stripeWebhook.js'), import('./cancelOrders.js'),
  import('./eventInformationMail.js'),
  import('./shopOpen.js'),
  import('./eventStatusChangeMail.js'),
  import('./eventMenusSnapshot.js'),
  import('./pollingTask.js'),
  import('./user.js'),
  import('./deleteUserAccount.js'),
  import('./eventReceipt.js'),
  import('./eventCopy.js'),
  import('./eventBillInvoice.js'),
  import('./eventMenusSelection.js'),
  import('./userImage.js'),
  import('./memberOrders.js'),
  import('./eventMembers.js'),
])))
