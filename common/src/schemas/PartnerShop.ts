import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema, NonEmptyStringSchema } from './firebase/index.js'

export const GENRE_ARRAY = [
  '弁当',
  '丼もの',
  'おにぎり',
  '和食',
  '寿司',
  '魚介料理',
  '海鮮料理',
  '天ぷら',
  '揚げ物',
  'そば',
  'うどん',
  '麺類',
  'うなぎ・どじょう・あなご',
  '焼鳥',
  '串焼',
  '鳥料理',
  'すき焼き',
  'しゃぶしゃぶ',
  'おでん',
  'お好み焼き',
  'たこ焼き',
  '日本料理',
  '郷土料理',
  'ステーキ',
  'ハンバーグ',
  '鉄板焼き',
  'パスタ',
  'ピザ',
  'ハンバーガー',
  '洋食',
  '欧風料理',
  'フレンチ',
  'イタリアン',
  'スペイン料理',
  '西洋各国料理',
  '中華料理',
  '餃子',
  '肉まん',
  '中華粥',
  '中華麺',
  '韓国料理',
  '東南アジア料理',
  '南アジア料理',
  '西アジア料理',
  '中南米料理',
  'アフリカ料理',
  'アジア・エスニック',
  'カレーライス',
  '欧風カレー',
  'インドカレー',
  'スパイスカレー',
  'タイカレー',
  'スープカレー',
  'カレー',
  '焼肉',
  'ホルモン',
  'ジンギスカン',
  'ちゃんこ鍋',
  'うどんすき',
  'もつ鍋',
  '水炊き',
  'ちりとり鍋・てっちゃん鍋',
  '中国鍋・火鍋',
  '韓国鍋',
  'タイスキ',
  '鍋',
  '居酒屋',
  'ダイニングバー',
  '創作料理',
  'イノベーティブ・フュージョン',
  '無国籍料理',
  'ファミレス',
  'レストラン',
  '自然食',
  '薬膳',
  'ラーメン',
  '油そば',
  '台湾まぜそば',
  '汁なし担々麺',
  'つけ麺',
  'カフェ',
  '喫茶店',
  'コーヒー専門店',
  '紅茶専門店',
  '中国茶専門店',
  '日本茶専門店',
  'パン',
  'サンドイッチ',
  'ベーグル',
  '洋菓子',
  '和菓子・甘味処',
  '中華菓子',
  'スイーツ',
  '低糖質',
  'キッチンカー',
  'キムチ',
  '焼き芋',
  'その他',
] as const

const PartnerShopDbSchema = z.object({
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  partner_id: z.string().nonempty(),
  shop_id: z.string().nonempty(),
  shop_name: z.string().nonempty(),
  shop_address: z.string().nonempty(),
  shop_address_latitude: z.number().positive(),
  shop_address_longitude: z.number().positive(),
  shop_deadline_datetime: z.object({
    days_before: z.number().int().positive(),
    time: z.number().int().positive(),
  }),
  shop_description: z.string().nonempty(),
  shop_email: z.string().email().nonempty(),
  shop_genre: z.enum(GENRE_ARRAY),
  shop_image_url: z.string().url().nonempty(),
  shop_phone: z.string().nonempty(),
  shop_postcode: z.string().nonempty(),
  shop_range_min_orders: z.array(
    z.object({
      range: z.number().positive(),
      min_orders: z.number().int().positive(),
    }),
  ),
  shop_time: z
    .array(
      z.object({
        is_open: z.boolean(),
        time_start: z.string().nonempty(),
        time_end: z.string().nonempty(),
        time_start2: z.string().nonempty(),
        time_end2: z.string().nonempty(),
      }),
    )
    .length(7),
  is_approved: z.boolean(),
  is_open: z.boolean(),
  // Optional
  community_account: NonEmptyStringSchema,
  shop_invoice_number: NonEmptyStringSchema,
  shop_email_sub1: NonEmptyStringSchema,
  shop_email_sub2: NonEmptyStringSchema,
  shop_email_sub3: NonEmptyStringSchema,
  shop_url: NonEmptyStringSchema,
  shop_url_facebook: NonEmptyStringSchema,
  shop_url_instagram: NonEmptyStringSchema,
  shop_url_twitter: NonEmptyStringSchema,
})

const PartnerShopAppSchema = z.object({
  // Mandatory
  partner_id: z.string().nonempty(),
  shop_id: z.string().nonempty(),
  // Default
  is_approved: z.boolean().default(false),
  is_open: z.boolean().default(false),
  shop_deadline_datetime: z
    .object({
      days_before: z.number().int().positive(),
      time: z.number().int().positive(),
    })
    .default({
      days_before: 1,
      time: 53100000,
    }),
  shop_range_min_orders: z
    .array(
      z.object({
        // 本当は nullable にはしたくないが、初期実装を踏襲
        range: z.number().positive().nullable(),
        min_orders: z.number().int().positive().nullable(),
      }),
    )
    .default([
      { range: 2, min_orders: 4 },
      { range: 5, min_orders: 6 },
      { range: 10, min_orders: 8 },
    ]),
  shop_time: z
    .array(
      z.object({
        is_open: z.boolean(),
        // TODO 文字列ではなく数字にする
        time_start: z.string().nonempty(),
        time_end: z.string().nonempty(),
        // 本当は nonempty にしたいところだが、初期実装を踏襲
        time_start2: z.string(),
        time_end2: z.string(),
      }),
    )
    .length(7)
    .default([
      { is_open: true, time_start: '6:00', time_end: '23:00', time_start2: '', time_end2: '' },
      { is_open: true, time_start: '6:00', time_end: '23:00', time_start2: '', time_end2: '' },
      { is_open: true, time_start: '6:00', time_end: '23:00', time_start2: '', time_end2: '' },
      { is_open: true, time_start: '6:00', time_end: '23:00', time_start2: '', time_end2: '' },
      { is_open: true, time_start: '6:00', time_end: '23:00', time_start2: '', time_end2: '' },
      { is_open: true, time_start: '6:00', time_end: '23:00', time_start2: '', time_end2: '' },
      { is_open: true, time_start: '6:00', time_end: '23:00', time_start2: '', time_end2: '' },
    ]),
  // Optional
  shop_address: z.string().nonempty().optional(),
  shop_address_latitude: z.number().positive().optional(),
  shop_address_longitude: z.number().positive().optional(),
  shop_description: z.string().nonempty().optional(),
  shop_email: z.string().email().nonempty().optional(),
  shop_genre: z.enum(GENRE_ARRAY).optional(),
  shop_image_url: z.string().url().nonempty().optional(),
  shop_invoice_number: z.string().nonempty().optional(),
  shop_name: z.string().nonempty().optional(),
  shop_phone: z.string().nonempty().optional(),
  shop_postcode: z.string().nonempty().optional(),
  shop_url: z.string().url().nonempty().optional(),
  shop_url_facebook: z.string().nonempty().optional(),
  shop_url_instagram: z.string().nonempty().optional(),
  shop_url_twitter: z.string().nonempty().optional(),
  community_account: z.string().nonempty().optional(),
  shop_email_sub1: z.string().nonempty().optional(),
  shop_email_sub2: z.string().nonempty().optional(),
  shop_email_sub3: z.string().nonempty().optional(),
})

export class PartnerShop {
  // Mandatory
  readonly id: string
  readonly shop_id: string
  createdAt: number
  updatedAt: number
  partner_id!: string
  // Default
  is_approved!: boolean
  is_open!: boolean
  shop_deadline_datetime!: {
    days_before: number
    time: number
  }
  shop_range_min_orders!: {
    range: number
    min_orders: number
  }
  shop_time!: {
    is_open: boolean
    time_start: string
    time_end: string
    time_start2: string
    time_end2: string
  }[]
  // Optional
  shop_address?: string
  shop_address_latitude?: number
  shop_address_longitude?: number
  shop_description?: number
  shop_email?: number
  shop_genre?: typeof GENRE_ARRAY
  shop_image_url?: string
  shop_invoice_number?: string
  shop_name?: string
  shop_phone?: string
  shop_postcode?: string
  shop_url?: string
  shop_url_facebook?: string
  shop_url_instagram?: string
  shop_url_twitter?: string
  community_account?: string
  shop_email_sub1?: string
  shop_email_sub2?: string
  shop_email_sub3?: string

  constructor(id: string, src: Partial<PartnerShop>) {
    Object.assign(this, PartnerShopAppSchema.parse(src))
    this.id = id
    this.shop_id = id
    this.createdAt = EpochMillisSchema.default(Date.now()).parse(src.createdAt)
    this.updatedAt = Date.now()
  }

  private getDb() {
    return {
      ...this,
      createdAt: EpochMillisSchema.default(Date.now()).parse(this.createdAt),
      updatedAt: Date.now(),
    }
  }

  isValidForDatabase(): boolean {
    return PartnerShopDbSchema.safeParse(this.getDb()).success
  }

  toFirestore(): z.infer<typeof PartnerShopDbSchema> {
    return PartnerShopDbSchema.parse(this.getDb())
  }
}
