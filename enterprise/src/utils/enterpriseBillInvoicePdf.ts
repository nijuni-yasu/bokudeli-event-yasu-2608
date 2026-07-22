import { getAuth } from 'firebase/auth'

export const getEnterpriseBillInvoicePdf = async (
  enterpriseId: string,
  yearMonth: string,
  invoiceId?: string,
): Promise<Response> => {
  const user = getAuth().currentUser
  if (user == null) {
    throw new Error('Not authenticated')
  }
  const token = await user.getIdToken()
  const params = new URLSearchParams({ year_month: yearMonth })
  if (invoiceId != null) {
    params.set('id', invoiceId)
  }
  return fetch(
    `https://asia-northeast1-${import.meta.env.VITE_PROJECT_ID}.cloudfunctions.net/enterpriseBillInvoice/${enterpriseId}?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )
}
