import { getAuth } from 'firebase-admin/auth'
import { onCall, HttpsError } from 'firebase-functions/https'
import {
  CreateEnterpriseRequest,
  CreateEnterpriseResponse,
  GetEnterpriseByDomainRequest,
  GetEnterpriseByDomainResponse,
} from '@shokujii/common/apis/enterprise.js'
import { Enterprise, EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import { computeBillingTrialEndsAtMillis } from '@shokujii/common/utils/isEnterpriseMemberBillableInYearMonth.js'
import { getConfigGlobal } from '../stores/config.js'
import {
  getEnterpriseByCustomDomain,
  getEnterpriseById,
  getEnterpriseBySubdomain,
  saveEnterprise,
  saveEnterpriseMember,
} from '../stores/enterprise.js'
import { getUserIdFromEmail, saveUser, ShokujiiUser } from '../stores/user.js'
import { writeAuditLog } from '../utils/auditLog.js'
import { createModuleLogger } from '../utils/logger.js'

const logger = createModuleLogger('enterprise')

const DEFAULT_UNIT_PRICE = 500
const DEFAULT_TRIAL_MONTHS = 3

function assertSupport(uid: string | undefined): void {
  if (uid == null) {
    throw new HttpsError('unauthenticated', 'not logged in')
  }
}

async function assertIsSupport(uid: string): Promise<void> {
  const config = await getConfigGlobal()
  if (config?.isSupport(uid) !== true) {
    throw new HttpsError('permission-denied', 'support only')
  }
}

function emailDomainMatches(email: string, allowedDomains: string[]): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (domain == null || domain === '') return false
  return allowedDomains.some((d) => d.toLowerCase() === domain)
}

function getClientIp(rawRequest: { headers?: Record<string, string | string[] | undefined> }): string | undefined {
  const forwarded = rawRequest.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim()
  if (Array.isArray(forwarded)) return forwarded[0]?.split(',')[0]?.trim()
  return undefined
}

export const createEnterprise = onCall<CreateEnterpriseRequest, Promise<CreateEnterpriseResponse>>(async (request) => {
  const uid = request.auth?.uid
  assertSupport(uid)
  await assertIsSupport(uid!)

  const data = request.data
  const {
    enterprise_id: enterpriseId,
    company_name: companyName,
    subdomain,
    custom_domain: customDomain,
    allowed_email_domains: allowedEmailDomains,
    theme_color: themeColor,
    initial_subsidy_settings: initialSubsidy,
    initial_admin: initialAdmin,
  } = data

  if (enterpriseId == null || companyName == null || subdomain == null || allowedEmailDomains == null) {
    throw new HttpsError('invalid-argument', 'required fields missing')
  }
  if (allowedEmailDomains.length === 0) {
    throw new HttpsError('invalid-argument', 'allowed_email_domains is empty')
  }
  if (initialAdmin?.email == null || initialAdmin.display_name == null) {
    throw new HttpsError('invalid-argument', 'initial_admin is incomplete')
  }
  if (!emailDomainMatches(initialAdmin.email, allowedEmailDomains)) {
    throw new HttpsError('invalid-argument', 'initial_admin email domain not allowed')
  }

  const [existingById, existingBySubdomain, existingByCustomDomain, existingUserId] = await Promise.all([
    getEnterpriseById(enterpriseId),
    getEnterpriseBySubdomain(subdomain),
    customDomain != null && customDomain !== ''
      ? getEnterpriseByCustomDomain(customDomain)
      : Promise.resolve(undefined),
    getUserIdFromEmail(initialAdmin.email),
  ])

  if (existingById != null) {
    throw new HttpsError('already-exists', 'enterprise_id already exists')
  }
  if (existingBySubdomain != null) {
    throw new HttpsError('already-exists', 'subdomain already exists')
  }
  if (existingByCustomDomain != null) {
    throw new HttpsError('already-exists', 'custom_domain already exists')
  }
  if (existingUserId != null) {
    throw new HttpsError('already-exists', 'initial_admin email already in use')
  }

  const now = Date.now()
  const billingTrialEndsAt = computeBillingTrialEndsAtMillis(now)

  const enterprise = new Enterprise(enterpriseId, {
    company_name: companyName,
    subdomain,
    custom_domain: customDomain,
    allowed_email_domains: allowedEmailDomains,
    theme_color: themeColor ?? '#1976D2',
    discount_type: initialSubsidy.type,
    discount_value: initialSubsidy.value,
    monthly_limit_per_user: initialSubsidy.monthly_limit_per_user,
    billing_settings: {
      unit_price: DEFAULT_UNIT_PRICE,
      trial_months: DEFAULT_TRIAL_MONTHS,
      billing_trial_ends_at: billingTrialEndsAt,
    },
    is_active: true,
    created_at: now,
  })

  await saveEnterprise(enterprise)

  const authUser = await getAuth().createUser({
    email: initialAdmin.email,
    emailVerified: true,
    displayName: initialAdmin.display_name,
  })

  await getAuth().setCustomUserClaims(authUser.uid, {
    enterprise_id: enterpriseId,
    enterprise_role: 'admin',
    user_type: 'enterprise',
  })

  const member = new EnterpriseMember(authUser.uid, {
    role: 'admin',
    is_active: true,
    last_activated_at: now,
    last_deactivated_at: null,
    display_name: initialAdmin.display_name,
    department: initialAdmin.department,
    monthly_usage: {},
    monthly_order_count: {},
    created_at: now,
  })

  await saveEnterpriseMember(member, enterpriseId)

  await saveUser(
    new ShokujiiUser(authUser.uid, {
      user_name: initialAdmin.display_name,
      user_type: 'enterprise',
      enterprise_id: enterpriseId,
      user_email: initialAdmin.email,
      created_at: now,
    }),
  )

  await writeAuditLog({
    enterpriseId,
    userId: uid!,
    action: 'enterprise_create',
    targetId: enterpriseId,
    targetType: 'enterprise',
    ipAddress: getClientIp(request.rawRequest),
    details: {
      company_name: companyName,
      subdomain,
      initial_admin_email: initialAdmin.email,
    },
  })

  logger.info('enterprise_created', { enterpriseId, initialAdminUserId: authUser.uid })

  return {
    enterprise_id: enterpriseId,
    initial_admin_user_id: authUser.uid,
  }
})

/** ホスト名から enterprise_id とブランディング最小情報を解決（未認証 Callable） */
export const getEnterpriseByDomain = onCall<GetEnterpriseByDomainRequest, Promise<GetEnterpriseByDomainResponse>>(
  async (request) => {
    const { hostname } = request.data
    if (hostname == null || hostname === '') {
      throw new HttpsError('invalid-argument', 'hostname is required')
    }

    const host = hostname.toLowerCase()

    // subdomain.shokujii.com 形式
    const subdomainMatch = /^([a-z0-9-]+)\.shokujii\.com$/.exec(host)
    let enterprise: Enterprise | undefined
    if (subdomainMatch != null) {
      enterprise = await getEnterpriseBySubdomain(subdomainMatch[1]!)
    } else {
      enterprise = await getEnterpriseByCustomDomain(host)
    }

    if (enterprise == null || !enterprise.is_active) {
      throw new HttpsError('not-found', 'enterprise not found')
    }

    return {
      enterprise_id: enterprise.enterprise_id,
      company_name: enterprise.company_name,
      company_logo_url: enterprise.company_logo_url,
      theme_color: enterprise.theme_color,
      subdomain: enterprise.subdomain,
    }
  },
)
