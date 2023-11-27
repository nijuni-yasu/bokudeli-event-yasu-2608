import { Timestamp } from 'firebase/firestore'

type Shop = {
  shop_id: string
  shop_name: string
  shop_image_url: string
  shop_description: string

  partner_id: string

  shop_url: string
  shop_postcode: string
  shop_address: string

  shop_address_latitude: number
  shop_address_longitude: number

  shop_range_min_orders: [{ range: number; min_orders: number; label: string }]

  createdAt: Timestamp
  updatedAt: Timestamp

  shop_genre: string
  shop_time: [
    {
      label_ja: string
      label_en: string
      is_open: boolean
      time_start: string
      time_end: string
      time_start2: string
      time_end2: string
    }
  ]

  is_approved: boolean
  is_open: boolean
/*
  shop_holidays: any[]

  shop_phone: string
  shop_email: string
  shop_email_sub1: string
  shop_email_sub2: string
  shop_email_sub3: string

  shop_url_twitter: string
  shop_url_facebook: string
  shop_url_instagram: string

  shop_deadline_date: string
  shop_deadline_time: string // 時間（日付なし）なのでいい型があれば

  shop_time_delivery: string // number？

  shop_margin_time: string // number？
  shop_order_method: string[]
*/
}

export default Shop
