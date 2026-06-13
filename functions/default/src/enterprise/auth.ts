import { getAuth } from 'firebase-admin/auth'
import { onCall, HttpsError } from 'firebase-functions/https'
import {
  ConfirmEnterpriseEmailLoginRequest,
  ConfirmEnterpriseEmailLoginResponse,
  RequestEnterpriseEmailLoginRequest,
  RequestEnterpriseEmailLoginResponse,
} from '@shokujii/common/apis/enterprise.js'
import { getEnterpriseById, getEnterpriseMember } from '../stores/enterprise.js'
import { getUserIdFromEmail } from '../stores/user.js'
import {
  deletePassCode,
  getValidEnterprisePassCodeFromEmail,
  savePassCode,
  ShokujiiPassCode,
} from '../stores/passCode.js'
import { send } from '../utils/sendgrid.js'
import { DEFAULT_FROM } from '../utils/mail.js'
import { writeAuditLog } from '../utils/auditLog.js'
import { emailDomainMatches, getClientIp, normalizeEnterpriseEmail } from '../utils/enterpriseAuthHelpers.js'
import { createModuleLogger } from '../utils/logger.js'
import { isEnterpriseAppCheckEnforced } from '../utils/enterpriseAppCheck.js'

const logger = createModuleLogger('enterprise-auth')

// SendGrid テンプレート作成後に実 ID を記入（documents/sendgridテンプレ/enterprise_pass_code.md）
const ENTERPRISE_PASS_CODE_TEMPLATE_ID = 'd-df16d8a143e2488891841fb739ce36f3'

type EnterpriseCustomClaims = {
  enterprise_id: string
  enterprise_role: 'admin' | 'member'
  user_type: 'enterprise'
}

async function syncEnterpriseCustomClaims(uid: string, enterpriseId: string, role: 'admin' | 'member'): Promise<void> {
  const auth = getAuth()
  const user = await auth.getUser(uid)
  const current = user.customClaims ?? {}
  const expected: EnterpriseCustomClaims = {
    enterprise_id: enterpriseId,
    enterprise_role: role,
    user_type: 'enterprise',
  }
  if (
    current.enterprise_id !== expected.enterprise_id ||
    current.enterprise_role !== expected.enterprise_role ||
    current.user_type !== expected.user_type
  ) {
    await auth.setCustomUserClaims(uid, { ...current, ...expected })
  }
}

export const requestEnterpriseEmailLogin = onCall<
  RequestEnterpriseEmailLoginRequest,
  Promise<RequestEnterpriseEmailLoginResponse>
>(
  {
    secrets: ['SENDGRID_API_KEY'],
    enforceAppCheck: isEnterpriseAppCheckEnforced(),
  },
  async (request) => {
    const { enterprise_id: enterpriseId, email: rawEmail } = request.data
    if (enterpriseId == null || rawEmail == null) {
      throw new HttpsError('invalid-argument', 'enterprise_id or email is missing')
    }

    const email = normalizeEnterpriseEmail(rawEmail)
    const enterprise = await getEnterpriseById(enterpriseId)
    if (enterprise == null || !enterprise.is_active) {
      throw new HttpsError('not-found', 'enterprise not found')
    }
    if (!emailDomainMatches(email, enterprise.allowed_email_domains)) {
      throw new HttpsError('permission-denied', 'email domain not allowed')
    }

    const userId = await getUserIdFromEmail(email)
    if (userId == null) {
      throw new HttpsError('not-found', 'member not registered')
    }

    const member = await getEnterpriseMember(enterpriseId, userId)
    if (member == null) {
      throw new HttpsError('not-found', 'member not registered')
    }
    if (!member.is_active) {
      throw new HttpsError('permission-denied', 'account is disabled')
    }

    const passCode = new ShokujiiPassCode(null, { user_id: userId, user_email: email, enterprise_id: enterpriseId })
    await Promise.all([
      savePassCode(passCode),
      send({
        to: email,
        from: DEFAULT_FROM,
        templateId: ENTERPRISE_PASS_CODE_TEMPLATE_ID,
        dynamicTemplateData: {
          user_pass_code: passCode.pass_code,
          company_name: enterprise.company_name,
        },
      }),
    ])

    logger.info('enterprise_otp_sent', { enterpriseId, userId })
    return { success: true }
  },
)

export const confirmEnterpriseEmailLogin = onCall<
  ConfirmEnterpriseEmailLoginRequest,
  Promise<ConfirmEnterpriseEmailLoginResponse>
>(
  {
    enforceAppCheck: isEnterpriseAppCheckEnforced(),
  },
  async (request) => {
    const { enterprise_id: enterpriseId, email: rawEmail, pass_code: passCodeInput } = request.data
    if (enterpriseId == null || rawEmail == null || passCodeInput == null) {
      throw new HttpsError('invalid-argument', 'enterprise_id, email or pass_code is missing')
    }

    const email = normalizeEnterpriseEmail(rawEmail)
    const passCodeDocument = await getValidEnterprisePassCodeFromEmail(email, enterpriseId)
    if (passCodeDocument == null || passCodeDocument.pass_code !== passCodeInput) {
      throw new HttpsError('invalid-argument', 'pass code is not valid')
    }

    const enterprise = await getEnterpriseById(enterpriseId)
    if (enterprise == null || !enterprise.is_active) {
      throw new HttpsError('not-found', 'enterprise not found')
    }
    if (!emailDomainMatches(email, enterprise.allowed_email_domains)) {
      throw new HttpsError('permission-denied', 'email domain not allowed')
    }

    const userId = await getUserIdFromEmail(email)
    if (userId == null) {
      throw new HttpsError('not-found', 'member not found')
    }

    const member = await getEnterpriseMember(enterpriseId, userId)
    if (member == null) {
      throw new HttpsError('not-found', 'not a member of this enterprise')
    }
    if (!member.is_active) {
      throw new HttpsError('permission-denied', 'account is disabled')
    }

    await deletePassCode(passCodeDocument.id)
    await syncEnterpriseCustomClaims(userId, enterpriseId, member.role)

    const token = await getAuth().createCustomToken(userId)

    await writeAuditLog({
      enterpriseId,
      userId,
      action: 'login',
      ipAddress: getClientIp(request.rawRequest),
    })

    return { token }
  },
)
