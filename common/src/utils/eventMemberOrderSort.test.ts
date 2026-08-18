import { describe, expect, it } from 'vitest'
import { EventMemberOrder } from '../schemas/EventMemberOrder.js'
import {
  compareEventMemberOrdersForEnterpriseSubsidyReplay,
  sortEventMemberOrdersForEnterpriseSubsidyReplay,
  sortOrderIdsForEnterpriseSubsidyReplay,
} from './eventMemberOrderSort.js'

const makeOrder = (id: string, cartedAt: number, updatedAt: number): EventMemberOrder => {
  const order = new EventMemberOrder(id, {
    order_id: id,
    user_id: 'u1',
    event_id: 'e1',
    community_id: 'c1',
    menu_id: 'm1',
    menu_name: 'menu',
    menu_price: 800,
    carted_at: cartedAt,
    updated_at: updatedAt,
  })
  return order
}

describe('compareEventMemberOrdersForEnterpriseSubsidyReplay', () => {
  it('carted_at 昇順で並べ、updated_at は無視する', () => {
    const older = makeOrder('o-old', 1000, 9000)
    const newer = makeOrder('o-new', 2000, 1000)
    expect(compareEventMemberOrdersForEnterpriseSubsidyReplay(older, newer)).toBeLessThan(0)
    expect(sortEventMemberOrdersForEnterpriseSubsidyReplay([newer, older]).map((o) => o.order_id)).toEqual([
      'o-old',
      'o-new',
    ])
  })

  it('carted_at 同値は order_id 昇順', () => {
    const b = makeOrder('o-b', 1000, 5000)
    const a = makeOrder('o-a', 1000, 9000)
    expect(sortOrderIdsForEnterpriseSubsidyReplay([b, a])).toEqual(['o-a', 'o-b'])
  })
})
