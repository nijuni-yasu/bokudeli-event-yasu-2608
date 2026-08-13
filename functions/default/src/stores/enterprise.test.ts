import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FieldPath, FieldValue } from 'firebase-admin/firestore'

vi.mock('firebase-admin/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase-admin/firestore')>()
  return {
    ...actual,
    getFirestore: vi.fn(() => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              withConverter: vi.fn(() => 'member-ref'),
            })),
          })),
        })),
      })),
    })),
  }
})

import { adjustEnterpriseMemberMonthlyUsage } from './enterprise.js'

describe('adjustEnterpriseMemberMonthlyUsage', () => {
  let updateMock: ReturnType<typeof vi.fn>
  let callOrder: string[]

  beforeEach(() => {
    updateMock = vi.fn()
    callOrder = []
  })

  it('transaction.get を transaction.update より先に呼ぶ（RC-112/111/103）', async () => {
    const transaction = {
      get: vi.fn(async () => {
        callOrder.push('get')
        return {
          exists: true,
          data: () => ({
            monthly_usage: { '2026-06': 1000 },
            monthly_order_count: { '2026-06': 1 },
            monthly_user_paid: { '2026-06': 400 },
          }),
        }
      }),
      update: vi.fn((...args: unknown[]) => {
        callOrder.push('update')
        updateMock(...args)
      }),
    }

    await adjustEnterpriseMemberMonthlyUsage('ent-a', 'user-a', '2026-06', 500, 1, 200, transaction as never)

    expect(callOrder).toEqual(['get', 'update'])
  })

  it('2026-06 形式の eventMonth を FieldPath で更新する（RC-113）', async () => {
    const transaction = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({
          monthly_usage: { '2026-06': 1000 },
          monthly_order_count: { '2026-06': 1 },
          monthly_user_paid: { '2026-06': 400 },
        }),
      })),
      update: vi.fn((...args: unknown[]) => {
        updateMock(...args)
      }),
    }

    await adjustEnterpriseMemberMonthlyUsage('ent-a', 'user-a', '2026-06', 500, 1, 200, transaction as never)

    expect(updateMock).toHaveBeenCalledWith(
      'member-ref',
      new FieldPath('monthly_usage', '2026-06'),
      1500,
      new FieldPath('monthly_order_count', '2026-06'),
      2,
      new FieldPath('monthly_user_paid', '2026-06'),
      600,
      'updated_at',
      FieldValue.serverTimestamp(),
    )
  })
})
