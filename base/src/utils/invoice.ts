import { getAuth } from 'firebase/auth'

export const getInvoicePdf = async (eventId: string, orderId: string): Promise<Blob> => {
  const token = await getAuth().currentUser!.getIdToken()
  const data = await fetch(
    `https://asia-northeast1-${import.meta.env.VITE_PROJECT_ID}.cloudfunctions.net/invoice/${eventId}/${orderId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )
  return data.blob()
}
