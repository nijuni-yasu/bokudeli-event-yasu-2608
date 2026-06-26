import { describe, expect, it } from 'vitest'
import { Enterprise, EnterpriseMember } from './Enterprise.js'

describe('Enterprise', () => {
  it('custom_domain 省略時は toFirestore に custom_domain キーを含めない', () => {
    const enterprise = new Enterprise('ent-1', {
      company_name: 'Test Corp',
      subdomain: 'testcorp',
      allowed_email_domains: ['example.com'],
      discount_type: 'fixed',
      discount_value: 500,
      monthly_limit_per_user: 7500,
      billing_settings: {
        unit_price: 500,
        trial_months: 3,
        billing_trial_ends_at: Date.now(),
      },
    })

    const firestore = enterprise.toFirestore()
    expect(firestore).not.toHaveProperty('custom_domain')
  })
})

describe('EnterpriseMember', () => {
  it('department 省略時は toFirestore に department キーを含めない', () => {
    const member = new EnterpriseMember('user-1', {
      role: 'admin',
      display_name: 'Admin User',
    })

    const firestore = member.toFirestore()
    expect(firestore).not.toHaveProperty('department')
  })
})
