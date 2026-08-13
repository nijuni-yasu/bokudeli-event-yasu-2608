import { buildFacebookUrl, buildTwitterUrl, buildInstagramUrl } from '@shokujii/base/utils/buildSnsLinks.js'
import { downloadCsv } from '@shokujii/base/utils/downloadCsv.js'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import type { User } from '@shokujii/common/schemas/User.js'

export const escapeCsvCell = (value: string): string => `"${value.replace(/"/g, '""')}"`

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
  dateLabel: string
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
}

export const buildEventMemberCsvHeaders = (options: BuildEventMemberCsvHeadersOptions): string[] => {
  const includeSnsColumns = options.includeSnsColumns !== false
  const headers = [options.statusLabel, options.nameLabel]
  if (includeSnsColumns) {
    headers.push('X', 'Facebook', 'Instagram')
  }
  headers.push(options.orderLabel, options.menuPriceLabel)
  if (options.includeCommunityBill) {
    headers.push(options.communityBillOffLabel)
  }
  headers.push(options.dateOrderedLabel)
  return headers
}

export const buildEventMemberCsvRows = (
  rows: EventMemberCsvRowInput[],
  options: Pick<BuildEventMemberCsvHeadersOptions, 'includeCommunityBill' | 'includeSnsColumns'>,
): string[][] =>
  rows.map(({ order, member, statusLabel, dateLabel }) => {
    const includeSnsColumns = options.includeSnsColumns !== false
    const row = [statusLabel, member.user_name]
    if (includeSnsColumns) {
      row.push(
        member.user_sns_twitter !== '' ? buildTwitterUrl(member.user_sns_twitter) : '',
        member.user_sns_facebook !== '' ? buildFacebookUrl(member.user_sns_facebook) : '',
        member.user_sns_instagram !== '' ? buildInstagramUrl(member.user_sns_instagram) : '',
      )
    }
    row.push(order.menu_name, String(order.menu_price))
    if (options.includeCommunityBill) {
      row.push(String(order.pay_community_bill_off_amount ?? 0))
    }
    row.push(dateLabel)
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
    }),
  )

export const downloadMemberCsv = (filename: string, content: string): void => {
  downloadCsv(filename, content)
}
