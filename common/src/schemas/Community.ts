import { z } from 'zod'
import { NonEmptyStringSchema, TimestampSchema } from './firebase/index.js'

const CommunityDbSchema = z.object({
  // Mandatory
  community_id: z.string().nonempty(),
  community_name: z.string().nonempty(),
  community_account: z.string().nonempty(),
  community_cover_image_url: z.string().nonempty(),
  community_icon_image_url: z.string().nonempty(),
  community_sns_officialsite: z.string().nonempty(),
  is_public: z.boolean(),
  is_approved: z.boolean(),
  is_show_member: z.boolean(),
  subdomain_tags: z.array(z.string()),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  // Optional
  community_manager_fullname: NonEmptyStringSchema,
  community_company: NonEmptyStringSchema,
  community_postalcode: NonEmptyStringSchema,
  community_address: NonEmptyStringSchema,
  community_phone: NonEmptyStringSchema,
  community_email: NonEmptyStringSchema,
  community_use_purpose: NonEmptyStringSchema,
  community_desc: NonEmptyStringSchema,
  community_sns_facebook: NonEmptyStringSchema,
  community_sns_twitter: NonEmptyStringSchema,
  community_sns_instagram: NonEmptyStringSchema,
  community_sns_hash_tag: NonEmptyStringSchema,
  community_bill_fullname: NonEmptyStringSchema,
  community_bill_email: NonEmptyStringSchema,
})

// id 以外は デフォルト or オプショナル なので、 Schema は必要ない
export class Community {
  readonly id: string
  readonly community_id: string
  community_name: string = ''
  community_account: string = ''
  is_public: boolean = true
  is_approved: boolean = false
  is_show_member: boolean = true
  subdomain_tags: string[] = []
  community_manager_fullname: string = ''
  community_company: string = ''
  community_postalcode: string = ''
  community_address: string = ''
  community_phone: string = ''
  community_email: string = ''
  community_use_purpose: string = ''
  community_cover_image_url: string = ''
  community_icon_image_url: string = ''
  community_desc: string = ''
  community_sns_facebook: string = ''
  community_sns_twitter: string = ''
  community_sns_instagram: string = ''
  community_sns_officialsite: string = ''
  community_sns_hash_tag: string = ''
  community_bill_fullname: string = ''
  community_bill_email: string = ''
  updated_at: number = Date.now()
  created_at?: number

  constructor(id: string, src: Partial<Community>) {
    Object.assign(this, src)
    this.id = id
    this.community_id = id
  }

  private get db() {
    return {
      ...this,
      created_at: this.created_at ?? Date.now(),
      updated_at: Date.now(),
    }
  }

  isValidForDatabase(): boolean {
    return CommunityDbSchema.safeParse(this.db).success
  }

  toFirestore(): any {
    return CommunityDbSchema.parse(this.db)
  }
}
