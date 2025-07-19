import { functions } from '@shokujii/base/firebase'
import { httpsCallable } from 'firebase/functions'
import { sendTestLetterRequestSchema } from '@shokujii/common/apis/letter.js'

export const sendTestLetter = (input: any) => {
  const f = httpsCallable(functions, 'sendTestLetter')
  return f(sendTestLetterRequestSchema.parse(input))
}
