import { getAuth } from 'firebase/auth'

export const getNamesPrintPdf = async (eventId: string): Promise<Blob> => {
  const token = await getAuth().currentUser!.getIdToken()
  const data = await fetch(
    `https://asia-northeast1-${import.meta.env.VITE_PROJECT_ID}.cloudfunctions.net/namesprint/${eventId}`,
    //`http://127.0.0.1:5001/bokudeli-event-test/asia-northeast1/namesprint/${eventId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )
  return data.blob()
}
