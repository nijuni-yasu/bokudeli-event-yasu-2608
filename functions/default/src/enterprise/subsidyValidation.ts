import { HttpsError } from 'firebase-functions/https'
import { ENTERPRISE_DISCOUNT_TYPE_VALUES, type EnterpriseDiscountType } from '@shokujii/common/schemas/Enterprise.js'
import { YEAR_MONTH_PATTERN } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'
import { getMinimumEffectiveFromMonth } from '@shokujii/common/utils/datetime.js'

export function assertEffectiveFromMonthIsFuture(effectiveFromMonth: string): void {
  if (!YEAR_MONTH_PATTERN.test(effectiveFromMonth)) {
    throw new HttpsError('invalid-argument', 'effective_from_month must be YYYY-MM')
  }
  const minMonth = getMinimumEffectiveFromMonth()
  if (effectiveFromMonth < minMonth) {
    throw new HttpsError('invalid-argument', 'effective_from_month must be the next calendar month or later')
  }
}

export function validateSubsidySettings(
  discountType: EnterpriseDiscountType,
  discountValue: number,
  monthlyLimitPerUser: number,
): void {
  if (!ENTERPRISE_DISCOUNT_TYPE_VALUES.includes(discountType)) {
    throw new HttpsError('invalid-argument', 'invalid discount_type')
  }
  if (!Number.isInteger(discountValue)) {
    throw new HttpsError('invalid-argument', 'discount_value must be an integer')
  }
  if (discountType === 'fixed' && discountValue < 0) {
    throw new HttpsError('invalid-argument', 'fixed discount_value must be non-negative')
  }
  if (discountType === 'percentage' && (discountValue < 1 || discountValue > 100)) {
    throw new HttpsError('invalid-argument', 'percentage discount_value must be between 1 and 100')
  }
  if (!Number.isInteger(monthlyLimitPerUser) || monthlyLimitPerUser < 0) {
    throw new HttpsError('invalid-argument', 'monthly_limit_per_user must be a non-negative integer')
  }
}
