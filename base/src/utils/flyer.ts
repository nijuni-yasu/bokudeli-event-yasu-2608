import { getAuth } from 'firebase/auth'

export const getFlyerPdf = async (eventId: string, size: string = 'A4') => {
  const token = await getAuth().currentUser!.getIdToken()
  const data = await fetch(
    `https://asia-northeast1-${import.meta.env.VITE_PROJECT_ID}.cloudfunctions.net/flyer/${eventId}?size=${size}`,
    // `http://127.0.0.1:5001/bokudeli-event-test/asia-northeast1/flyer/${eventId}?size=${size}`,
    {
      method: 'GET',
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )
  return data.blob()
}
