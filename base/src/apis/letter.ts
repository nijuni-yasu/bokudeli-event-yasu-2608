import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import { sendTestLetterRequestSchema } from '@/commonApis/letter.js'

export const sendTestLetter = (input: any) => {
  const f = httpsCallable(functions, 'sendTestLetter')
  return f(sendTestLetterRequestSchema.parse(input))
}
