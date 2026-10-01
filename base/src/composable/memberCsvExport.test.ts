import { describe, expect, it } from 'vitest'
import {
  buildCommunityMemberCsv,
  buildCommunityMemberCsvRows,
  buildCsvContent,
  buildEventFormResponseCsv,
  buildEventMemberCsv,
  buildEventMemberCsvHeaders,
  buildEventMemberCsvRows,
  escapeCsvCell,
  type BuildEventMemberCsvHeadersOptions,
} from './memberCsvExport.js'
import { EventMemberOrder, EVENT_MEMBER_ORDER_STATUS_VALUES } from '@shokujii/common/schemas/EventMemberOrder.js'
import { User } from '@shokujii/common/schemas/User.js'

const sampleUser = (overrides: Partial<User> = {}): User =>
  new User('u1', {
    user_name: 'Alice "Test"',
    user_sns_twitter: 'alice',
    user_sns_facebook: '',
    user_sns_instagram: '',
    user_description: 'bio',
    user_tags: ['ランチ', '交流'],
    ...overrides,
  })

const sampleOrder = (overrides: Partial<EventMemberOrder> = {}): EventMemberOrder =>
  new EventMemberOrder('o1', {
    order_id: 'o1',
    user_id: 'u1',
    event_id: 'e1',
    community_id: 'c1',
    menu_id: 'm1',
    menu_name: 'ランチ',
    menu_price: 1000,
    pay_community_bill_off_amount: 200,
    status: 'ordered',
    ordered_at: 1_700_000_000_000,
    updated_at: 1_700_003_600_000,
    ...overrides,
  })

const eventHeaders: BuildEventMemberCsvHeadersOptions = {
  includeCommunityBill: true,
  statusLabel: 'ステータス',
  nameLabel: '名前',
  orderLabel: '注文内容',
  menuPriceLabel: 'メニュー金額',
  communityBillOffLabel: 'おごり金額',
  dateOrderedLabel: '注文日時',
  emptyDateLabel: 'ー',
  profileLabel: 'プロフィール',
  tagsLabel: 'タグ',
}

describe('escapeCsvCell', () => {
  it('ダブルクォートをエスケープする', () => {
    expect(escapeCsvCell('a"b')).toBe('"a""b"')
  })

  it.each(['=', '+', '-', '@', '\t', '\r'])('先頭が %j のとき単一引用符を前置する', (prefix) => {
    expect(escapeCsvCell(`${prefix}1+1`)).toBe(`"'${prefix}1+1"`)
  })

  it('先頭以外の数式文字はそのまま引用符で囲む', () => {
    expect(escapeCsvCell('合計=1')).toBe('"合計=1"')
  })

  it('数式先頭と引用符を同時に処理する', () => {
    expect(escapeCsvCell('=a"b')).toBe('"\'=a""b"')
  })
})

describe('buildCommunityMemberCsvRows', () => {
  it('SNS URL とプロフィールを含む行を生成する', () => {
    const rows = buildCommunityMemberCsvRows([sampleUser()])
    expect(rows[0][0]).toBe('Alice "Test"')
    expect(rows[0][1]).toContain('alice')
    expect(rows[0][4]).toBe('bio')
  })
})

describe('buildCommunityMemberCsv', () => {
  it('ヘッダー行付き CSV を生成する', () => {
    const csv = buildCommunityMemberCsv([sampleUser()])
    expect(csv.startsWith('"UserName","X","Facebook","Instagram","UserProfile"\n')).toBe(true)
    expect(csv).toContain('Alice ""Test""')
  })
})

describe('buildEventMemberCsv', () => {
  it('注文情報の後にSNS・プロフィール・タグを出力し、更新日時ではなく注文日時を使う', () => {
    const csv = buildEventMemberCsv(
      [{ order: sampleOrder(), member: sampleUser(), statusLabel: '注文済' }],
      eventHeaders,
    )
    expect(csv).toBe(
      '"ステータス","名前","注文内容","メニュー金額","おごり金額","注文日時","X","Facebook","Instagram","プロフィール","タグ"\n' +
        '"注文済","Alice ""Test""","ランチ","¥1,000","¥200","2023/11/15 7:13","https://twitter.com/alice","","","bio","ランチ / 交流"\n',
    )
  })

  it('includeSnsColumns: false のとき SNS 列を省略する', () => {
    const options = {
      ...eventHeaders,
      includeCommunityBill: false,
      includeSnsColumns: false,
    }
    const csv = buildEventMemberCsv([{ order: sampleOrder(), member: sampleUser(), statusLabel: '注文済' }], options)
    expect(csv).toBe(
      '"ステータス","名前","注文内容","メニュー金額","注文日時","プロフィール","タグ"\n' +
        '"注文済","Alice ""Test""","ランチ","¥1,000","2023/11/15 7:13","bio","ランチ / 交流"\n',
    )
  })

  it.each(EVENT_MEMBER_ORDER_STATUS_VALUES.filter((status) => status !== 'ordered'))(
    '%s の行を残し、過去のordered_atがあっても注文日時を「ー」にする',
    (status) => {
      const rows = buildEventMemberCsvRows(
        [{ order: sampleOrder({ status }), member: sampleUser(), statusLabel: status }],
        { includeCommunityBill: false, includeSnsColumns: false, emptyDateLabel: 'ー' },
      )
      expect(rows).toEqual([[status, 'Alice "Test"', 'ランチ', '¥1,000', 'ー', 'bio', 'ランチ / 交流']])
    },
  )

  it('ordered_atが未設定なら「ー」、プロフィール・タグが未設定なら空欄にする', () => {
    const rows = buildEventMemberCsvRows(
      [
        {
          order: sampleOrder({ ordered_at: undefined }),
          member: new User('u1', { user_name: 'Alice' }),
          statusLabel: '注文済',
        },
      ],
      { includeCommunityBill: false, includeSnsColumns: false, emptyDateLabel: 'ー' },
    )
    expect(rows).toEqual([['注文済', 'Alice', 'ランチ', '¥1,000', 'ー', '', '']])
  })

  it.each([
    { includeCommunityBill: true, includeSnsColumns: true },
    { includeCommunityBill: true, includeSnsColumns: false },
    { includeCommunityBill: false, includeSnsColumns: true },
    { includeCommunityBill: false, includeSnsColumns: false },
  ])('任意列の有無で見出しと値の列数がずれない: %j', (options) => {
    const headers = buildEventMemberCsvHeaders({ ...eventHeaders, ...options })
    const rows = buildEventMemberCsvRows([{ order: sampleOrder(), member: sampleUser(), statusLabel: '注文済' }], {
      ...options,
      emptyDateLabel: 'ー',
    })
    expect(rows[0]).toHaveLength(headers.length)
    expect(headers.slice(-2)).toEqual(['プロフィール', 'タグ'])
    expect(rows[0].slice(-2)).toEqual(['bio', 'ランチ / 交流'])
  })

  it('プロフィールやタグの先頭が数式文字なら単一引用符を付ける', () => {
    const member = sampleUser({
      user_description: '=1+1',
      user_tags: ['+tag', '-tag'],
    })
    const csv = buildEventMemberCsv([{ order: sampleOrder(), member, statusLabel: '注文済' }], eventHeaders)
    expect(csv).toContain('"\'=1+1","\'+tag / -tag"\n')
  })

  it('プロフィールやタグの改行・カンマ・引用符をCSVのセル内に保持する', () => {
    const member = sampleUser({
      user_description: 'こんにちは, "Alice"です\nよろしく',
      user_tags: ['食事,交流', '"和食"'],
    })
    const csv = buildEventMemberCsv([{ order: sampleOrder(), member, statusLabel: '注文済' }], eventHeaders)
    expect(csv).toContain('"こんにちは, ""Alice""です\nよろしく","食事,交流 / ""和食"""\n')
  })
})

describe('buildEventFormResponseCsv', () => {
  it('確定時ラベルを設問列にして複数選択を1セルに入れる', () => {
    const csv = buildEventFormResponseCsv([
      {
        user_id: 'u1',
        display_name: '太郎',
        participation_label: '参加確定',
        answered_at: '2026/01/01 12:00',
        updated_at: '2026/01/02 12:00',
        answers: [
          { field_label: '氏名', display_value: '山田' },
          { field_label: '希望', display_value: '昼、夜' },
        ],
      },
    ])
    expect(csv).toContain('"設問:氏名","設問:希望"')
    expect(csv).toContain('"u1","太郎","参加確定","2026/01/01 12:00","2026/01/02 12:00","山田","昼、夜"')
  })
})

describe('buildCsvContent', () => {
  it('空行なしで末尾改行を付ける', () => {
    expect(buildCsvContent(['A'], [['b']])).toBe('"A"\n"b"\n')
  })
})
