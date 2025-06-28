import { getAuth } from 'firebase/auth'

// TODO: onCall に変更し、apis に移動する
// See https://github.com/nijuniinc/bokudeli-event-new/issues/1642
export const getEventBillInvoicePdf = async (eventId: string, invoiceId?: string): Promise<Response> => {
  const token = await getAuth().currentUser!.getIdToken()
  const data = await fetch(
    `https://asia-northeast1-${import.meta.env.VITE_PROJECT_ID}.cloudfunctions.net/eventBillInvoice/${eventId}` +
      (invoiceId != null ? `?id=${invoiceId}` : ''),
    {
      method: 'GET',
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )
  return data
}
