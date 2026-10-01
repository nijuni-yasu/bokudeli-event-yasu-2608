import { buildFacebookUrl, buildTwitterUrl, buildInstagramUrl } from '@shokujii/base/utils/buildSnsLinks.js'
import { downloadCsv } from '@shokujii/base/utils/downloadCsv.js'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import type { User } from '@shokujii/common/schemas/User.js'
import { convertNumberToYen } from '@shokujii/common/utils/converter.js'
import { convertToDatetime } from '@shokujii/common/utils/datetime.js'

const formatCsvAmount = (amount: number): string => convertNumberToYen(amount).replace('￥', '¥')

/** 表計算ソフトがセル先頭で数式・コマンドとみなす文字。 */
const SPREADSHEET_FORMULA_PREFIX = /^[=+\-@\t\r]/

export const escapeCsvCell = (value: string): string => {
  const text = SPREADSHEET_FORMULA_PREFIX.test(value) ? `'${value}` : value
  return `"${text.replace(/"/g, '""')}"`
}

export const buildCsvContent = (headers: string[], rows: string[][]): string => {
  const lines = [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))]
  return `${lines.join('\n')}\n`
}

export const COMMUNITY_MEMBER_CSV_HEADERS = ['UserName', 'X', 'Facebook', 'Instagram', 'UserProfile'] as const

export const buildCommunityMemberCsvRows = (members: User[]): string[][] =>
  members.map((member) => [
    member.user_name,
    member.user_sns_twitter !== '' ? buildTwitterUrl(member.user_sns_twitter) : '',
    member.user_sns_facebook !== '' ? buildFacebookUrl(member.user_sns_facebook) : '',
    member.user_sns_instagram !== '' ? buildInstagramUrl(member.user_sns_instagram) : '',
    member.user_description ?? '',
  ])

export const buildCommunityMemberCsv = (members: User[]): string =>
  buildCsvContent([...COMMUNITY_MEMBER_CSV_HEADERS], buildCommunityMemberCsvRows(members))

export type EventMemberCsvRowInput = {
  order: EventMemberOrder
  member: User
  statusLabel: string
}

export type BuildEventMemberCsvHeadersOptions = {
  includeCommunityBill: boolean
  includeSnsColumns?: boolean
  statusLabel: string
  nameLabel: string
  orderLabel: string
  menuPriceLabel: string
  communityBillOffLabel: string
  dateOrderedLabel: string
  emptyDateLabel: string
  profileLabel: string
  tagsLabel: string
}

export const buildEventMemberCsvHeaders = (options: BuildEventMemberCsvHeadersOptions): string[] => {
  const includeSnsColumns = options.includeSnsColumns !== false
  const headers = [options.statusLabel, options.nameLabel, options.orderLabel, options.menuPriceLabel]
  if (options.includeCommunityBill) {
    headers.push(options.communityBillOffLabel)
  }
  headers.push(options.dateOrderedLabel)
  if (includeSnsColumns) {
    headers.push('X', 'Facebook', 'Instagram')
  }
  headers.push(options.profileLabel, options.tagsLabel)
  return headers
}

export const buildEventMemberCsvRows = (
  rows: EventMemberCsvRowInput[],
  options: Pick<BuildEventMemberCsvHeadersOptions, 'includeCommunityBill' | 'includeSnsColumns' | 'emptyDateLabel'>,
): string[][] =>
  rows.map(({ order, member, statusLabel }) => {
    const includeSnsColumns = options.includeSnsColumns !== false
    const row = [statusLabel, member.user_name, order.menu_name, formatCsvAmount(order.menu_price)]
    if (options.includeCommunityBill) {
      row.push(formatCsvAmount(order.pay_community_bill_off_amount ?? 0))
    }
    // 注文確定前・キャンセル済みの日時を「注文日時」として扱わない。
    row.push(
      order.status === 'ordered' && order.ordered_at != null
        ? convertToDatetime(order.ordered_at)
        : options.emptyDateLabel,
    )
    if (includeSnsColumns) {
      row.push(
        member.user_sns_twitter !== '' ? buildTwitterUrl(member.user_sns_twitter) : '',
        member.user_sns_facebook !== '' ? buildFacebookUrl(member.user_sns_facebook) : '',
        member.user_sns_instagram !== '' ? buildInstagramUrl(member.user_sns_instagram) : '',
      )
    }
    row.push(member.user_description, member.user_tags.join(' / '))
    return row
  })

export const buildEventMemberCsv = (
  rows: EventMemberCsvRowInput[],
  headerOptions: BuildEventMemberCsvHeadersOptions,
): string =>
  buildCsvContent(
    buildEventMemberCsvHeaders(headerOptions),
    buildEventMemberCsvRows(rows, {
      includeCommunityBill: headerOptions.includeCommunityBill,
      includeSnsColumns: headerOptions.includeSnsColumns,
      emptyDateLabel: headerOptions.emptyDateLabel,
    }),
  )

export const downloadMemberCsv = (filename: string, content: string): void => {
  downloadCsv(filename, content)
}

export type EventFormResponseCsvRow = {
  user_id: string
  display_name: string
  participation_label: string
  answered_at: string
  updated_at: string
  answers: Array<{
    field_label: string
    display_value: string
  }>
}

export const buildEventFormResponseCsv = (rows: EventFormResponseCsvRow[]): string => {
  const labels: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    for (const answer of row.answers) {
      if (!seen.has(answer.field_label)) {
        seen.add(answer.field_label)
        labels.push(answer.field_label)
      }
    }
  }
  const headers = [
    'ユーザーID',
    '表示名',
    '参加状態',
    '回答日時',
    '更新日時',
    ...labels.map((label) => `設問:${label}`),
  ]
  const csvRows = rows.map((row) => {
    const byLabel = new Map(row.answers.map((answer) => [answer.field_label, answer.display_value]))
    return [
      row.user_id,
      row.display_name,
      row.participation_label,
      row.answered_at,
      row.updated_at,
      ...labels.map((label) => byLabel.get(label) ?? ''),
    ]
  })
  return buildCsvContent(headers, csvRows)
}
