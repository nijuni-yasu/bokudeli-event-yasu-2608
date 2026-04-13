/**
 * 住所フィールド分割まわりのユーティリティ（比較用正規化・Event 表示用フル住所）。
 * バッチ 0035・チェック 0035 では `normalizeAddressForComparison` と同一ロジックを別ファイルで保持する想定。
 *
 * PostcodeJP の allAddress の末尾除去は `base/src/utils/fetchLocation.ts` で行う。
 */

// --- 比較用正規化 ---

/**
 * 住所の比較用正規化（バッチ 0035・チェック 0035 の `normalizeAddressForComparison` と同一手順）
 *
 * 処理順:
 * 1. 先頭末尾の空白を trim
 * 2. ハイフン類を半角ハイフン U+002D に統一（長音記号 U+30FC は対象外）
 * 3. 全角英数字・記号 U+FF01〜U+FF5E を半角へ
 * 4. Unicode の空白文字をすべて除去（先頭末尾・途中の半角全角スペース含む）
 * 5. ゼロ幅文字 (U+200B〜U+200D, U+FEFF) を除去
 */

/** 長音 U+30FC は含めない */
const HYPHEN_LIKE = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g

/** ZERO WIDTH SPACE / NON-JOINER / JOINER, BOM（文字クラスだと no-misleading-character-class に抵触するためグループ化） */
const ZERO_WIDTH_LIKE = /(?:\u200B|\u200C|\u200D|\uFEFF)/g

const FULLWIDTH_BLOCK_START = 0xff01
const FULLWIDTH_BLOCK_END = 0xff5e
const FULLWIDTH_TO_HALFWIDTH_OFFSET = 0xfee0

/**
 * @param addr 比較する住所文字列
 * @returns 正規化後の文字列
 */
export function normalizeAddressForComparison(addr: string | null | undefined): string {
  let s = (addr ?? '').trim()
  s = s.replace(HYPHEN_LIKE, '-')
  let out = ''
  for (const ch of s) {
    const c = ch.codePointAt(0)
    if (c !== undefined && c >= FULLWIDTH_BLOCK_START && c <= FULLWIDTH_BLOCK_END) {
      out += String.fromCodePoint(c - FULLWIDTH_TO_HALFWIDTH_OFFSET)
    } else {
      out += ch
    }
  }
  s = out.replace(/\p{White_Space}/gu, '')
  s = s.replace(ZERO_WIDTH_LIKE, '')
  return s
}

// --- Event 表示用フル住所 ---
//
// 移行バッチで event を base/detail に分割した際、分割不能だと detail に「元の1行住所」がそのまま入ることがある。
// その状態で base と detail を結合すると住所が二重になる。
// normalize後、base と detail の先頭が同一都道府県で重なる等は二重と判定し、
// レガシー event_address が残っていればそちらを表示する（computeEventFullAddress）。

/** 日本の都道府県名（先頭重複判定用。長いものを先に照合するため長めの表記を優先） */
export const JAPAN_PREFECTURE_NAMES: readonly string[] = [
  '神奈川県',
  '和歌山県',
  '鹿児島県',
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '沖縄県',
].sort((a, b) => b.length - a.length)

export type EventFullAddressInput = {
  event_address?: string
  event_address_base?: string
  event_address_detail?: string
}

/**
 * 正規化後の base が detail の先頭に含まれる（= 結合すると基本住所が二重）か
 */
export function isBaseDuplicatedAtDetailHead(baseNorm: string, detailNorm: string): boolean {
  if (baseNorm.length === 0) return false
  return detailNorm.startsWith(baseNorm)
}

/**
 * 正規化後の base と detail が、いずれも同一の都道府県名で始まる場合に二重とみなす
 * （例: base が郵便番号 API 結果、detail に元の1行住所がそのまま入り、両方「東京都…」で始まる）
 */
export function isPrefectureDuplicateAtBothHeads(baseNorm: string, detailNorm: string): boolean {
  if (baseNorm.length === 0 || detailNorm.length === 0) return false
  for (const pref of JAPAN_PREFECTURE_NAMES) {
    const pn = normalizeAddressForComparison(pref)
    if (pn.length === 0) continue
    if (baseNorm.startsWith(pn) && detailNorm.startsWith(pn)) return true
  }
  return false
}

/**
 * base+detail の結合が二重表示になり得るか
 */
export function isEventAddressBaseDetailDuplicate(base: string, detail: string): boolean {
  const baseNorm = normalizeAddressForComparison(base)
  const detailNorm = normalizeAddressForComparison(detail)
  return isBaseDuplicatedAtDetailHead(baseNorm, detailNorm) || isPrefectureDuplicateAtBothHeads(baseNorm, detailNorm)
}

/**
 * Event の表示用フル住所。
 * 分割バッチで detail に元住所全体が入り base と重複する場合は、レガシー event_address を優先する。
 *
 * - event_address_base が無い場合はレガシー event_address のみ
 * - base がある場合は通常は base と detail を結合
 * - 二重と判定でき、かつレガシー event_address があればそれを表示
 */
export function computeEventFullAddress(input: EventFullAddressInput): string {
  const legacy = input.event_address?.trim() ?? ''
  const base = input.event_address_base?.trim() ?? ''
  const detail = input.event_address_detail?.trim() ?? ''

  if (!base) {
    return legacy
  }

  const merged = [base, detail].filter(Boolean).join(' ')
  if (detail.length > 0 && isEventAddressBaseDetailDuplicate(base, detail)) {
    if (legacy.length > 0) {
      return legacy
    }
  }
  return merged
}
