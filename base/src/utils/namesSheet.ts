import { getAuth } from 'firebase/auth'

export const getNamesSheetPdf = async (eventId: string): Promise<Blob> => {
  const token = await getAuth().currentUser!.getIdToken()
  const data = await fetch(
    `https://asia-northeast1-${import.meta.env.VITE_PROJECT_ID}.cloudfunctions.net/namesSheet/${eventId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )
  return data.blob()
}
