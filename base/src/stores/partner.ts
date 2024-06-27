import type { Ref } from 'vue'
import type { Store, StateTree } from 'pinia'
import type { DocumentReference, DocumentSnapshot, SnapshotOptions, Unsubscribe } from 'firebase/firestore'
import { Shop } from '@/schemes/shop'
import { PartnerMenu } from '@/schemes/partnerMenu'
import { defineStore } from 'pinia'
import { collection, doc, getFirestore, onSnapshot, Timestamp, setDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { uploadMenuImage, uploadShopImage } from '@/composable/uploadImage'

// 暫定的な措置
// 本来は変換を不要にする必要がある
// https://github.com/nijuniinc/bokudeli-event-new/issues/412
const convertToTimeString = (data: string | number) => {
  if (typeof data === 'string') {
    return data
  }
  const d = new Date(data)
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}

// withConverter を使って Firestore との変換を行う
// https://firebase.google.com/docs/firestore/query-data/get-data#custom_objects
const shopConverter = {
  toFirestore: (shop: Shop) => {
    for (const time of shop.shop_time) {
      time.time_start = convertToTimeString(time.time_start)
      time.time_end = convertToTimeString(time.time_end)
      time.time_start2 = convertToTimeString(time.time_start2)
      time.time_end2 = convertToTimeString(time.time_end2)
    }
    return {
      partner_id: shop.partner_id,
      shop_id: shop.shop_id,
      shop_name: shop.shop_name,
      shop_image_url: shop.shop_image_url,
      shop_description: shop.shop_description,
      shop_url: shop.shop_url,
      shop_postcode: shop.shop_postcode,
      shop_address: shop.shop_address,
      shop_address_latitude: shop.shop_address_latitude,
      shop_address_longitude: shop.shop_address_longitude,
      shop_phone: shop.shop_phone,
      shop_range_min_orders: shop.shop_range_min_orders,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
      shop_genre: shop.shop_genre,
      shop_time: shop.shop_time,
      is_approved: shop.is_approved,
      is_open: shop.is_open,
      shop_deadline_datetime: shop.shop_deadline_datetime,
      shop_url_facebook: shop.shop_url_facebook,
      shop_url_twitter: shop.shop_url_twitter,
      shop_url_instagram: shop.shop_url_instagram,
      shop_email: shop.shop_email,
      shop_email_sub1: shop.shop_email_sub1,
      shop_email_sub2: shop.shop_email_sub2,
      shop_email_sub3: shop.shop_email_sub3,
    }
  },
  fromFirestore: (snapshot: DocumentSnapshot, options: SnapshotOptions) => {
    const data = snapshot.data(options)
    const partnerId = snapshot.ref.parent.parent?.id
    if (data == null || partnerId == null) {
      return null
    }
    return new Shop(
      partnerId,
      snapshot.id,
      data.shop_name,
      data.shop_image_url,
      data.shop_description,
      data.shop_url,
      data.shop_postcode,
      data.shop_address,
      data.shop_address_latitude,
      data.shop_address_longitude,
      data.shop_phone,
      data.shop_range_min_orders,
      data.createdAt,
      data.updatedAt,
      data.shop_genre,
      data.shop_time,
      data.is_approved,
      data.is_open,
      data.shop_deadline_datetime,
      data.shop_url_facebook,
      data.shop_url_twitter,
      data.shop_url_instagram,
      data.shop_email,
      data.shop_email_sub1,
      data.shop_email_sub2,
      data.shop_email_sub3,
    )
  },
}
const menuConverter = {
  toFirestore: (menu: PartnerMenu) => {
    return {
      menu_name: menu.name,
      menu_price: menu.price,
      menu_image_url: menu.imageUrl,
      menu_description: menu.description,
      createdAt: menu.createdAt != null ? Timestamp.fromDate(menu.createdAt) : null,
      updatedAt: menu.updatedAt != null ? Timestamp.fromDate(menu.updatedAt) : null,
      is_soldout: menu.isSoldout,
      menu_date_start: menu.dateStart,
      menu_date_end: menu.dateEnd,
    }
  },
  fromFirestore: (snapshot: DocumentSnapshot, options: SnapshotOptions) => {
    const data = snapshot.data(options)
    const partnerId = snapshot.ref.parent.parent?.id
    if (data == null || partnerId == null) {
      return null
    }
    return new PartnerMenu(
      partnerId,
      snapshot.id,
      data.menu_name,
      data.menu_price,
      data.menu_image_url,
      data.menu_description,
      (data.createdAt as Timestamp | null)?.toDate() ?? null,
      (data.updatedAt as Timestamp | null)?.toDate() ?? null,
      data.is_soldout ?? false,
      data.menu_date_start,
      data.menu_date_end,
    )
  },
}

const db = getFirestore()

type PartnerStoreState = {
  shops: Ref<Shop[] | null>
  menus: Ref<PartnerMenu[] | null>
} & StateTree

type PartnerStoreGetters = {}

type PartnerStoreAction = {
  updateShop: (data: Shop, image?: File) => Promise<void>
  updateMenu: (data: PartnerMenu, image?: File) => Promise<void>
  deleteMenu: (menuId: string) => Promise<void>
  unsubscribe: () => void
}

export type PartnerStore = Store<string, PartnerStoreState, PartnerStoreGetters, PartnerStoreAction>
export const usePartnerStore = (partnerId: string): PartnerStore => {
  const store = defineStore<string, PartnerStoreState & PartnerStoreGetters & PartnerStoreAction>(
    `/partners/${partnerId}`,
    () => {
      const partnerRef: DocumentReference = doc(db, 'partners', partnerId)
      const _shops = ref<Shop[] | null>(null)
      const _menus = ref<PartnerMenu[] | null>(null)

      let unsubscribeShops: Unsubscribe | null = null
      const subscribeShops = () => {
        if (unsubscribeShops == null) {
          unsubscribeShops = onSnapshot(collection(partnerRef, 'shops'), (shopsSnapshot) => {
            _shops.value = shopsSnapshot.docs.map((shopDoc) => shopDoc.data() as Shop)
          })
        }
      }

      const shops = computed(() => {
        subscribeShops()
        return _shops.value
      })

      let unsubscribeMenus: Unsubscribe | null = null
      const subscribeMenus = () => {
        if (unsubscribeMenus == null) {
          unsubscribeMenus = onSnapshot(
            collection(partnerRef, 'menus').withConverter(menuConverter),
            (menusSnapshot) => {
              _menus.value = menusSnapshot.docs.map((menuDoc) => menuDoc.data() as PartnerMenu)
            },
          )
        }
      }

      const menus = computed(() => {
        subscribeMenus()
        return _menus.value
      })

      const updateShop = async (data: Shop, image?: File) => {
        if (data.shop_id == null) {
          const shopRef = await addDoc(collection(partnerRef, 'shops').withConverter(shopConverter), data)
          data.shop_id = shopRef.id
        }
        if (image != null) {
          data.shop_image_url = (await uploadShopImage(partnerRef.id, data.shop_id, image)) ?? ''
        }
        const shopRef = doc(partnerRef, 'shops', data.shop_id).withConverter(shopConverter)
        data.updatedAt = Timestamp.now()
        return await setDoc(shopRef, data)
      }

      const updateMenu = async (data: PartnerMenu, image?: File) => {
        if (data.id == null) {
          const menuRef = await addDoc(collection(partnerRef, 'menus').withConverter(menuConverter), data)
          data.id = menuRef.id
        }
        if (image != null) {
          data.imageUrl = (await uploadMenuImage(partnerRef.id, data.id, image)) ?? ''
        }
        const menuRef = doc(partnerRef, 'menus', data.id).withConverter(menuConverter)
        data.updatedAt = new Date()
        return await setDoc(menuRef, data)
      }

      const deleteMenu = async (menuId: string) => {
        const menuRef = doc(partnerRef, 'menus', menuId)
        return await deleteDoc(menuRef)
      }

      return {
        shops,
        menus,
        updateShop,
        updateMenu,
        deleteMenu,
        unsubscribe: () => {
          unsubscribeShops?.()
          unsubscribeShops = null
          unsubscribeMenus?.()
          unsubscribeMenus = null
        },
      }
    },
  )

  return store() as PartnerStore
}
