import { ref, computed, type Ref } from 'vue'
import type { Store, StateTree } from 'pinia'
import type {
  DocumentData,
  DocumentReference,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Unsubscribe,
} from 'firebase/firestore'
import { PartnerShop } from '@shokujii/common/schemas/PartnerShop.js'
import { PartnerMenu } from '@shokujii/common/schemas/PartnerMenu.js'
import { defineStore } from 'pinia'
import { collection, doc, getFirestore, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { uploadMenuImage, uploadShopImage } from '@shokujii/base/composable/uploadImage'

export class BokudeliPartnerShop extends PartnerShop {
  constructor(partner_id: string, shop_id: string | null, src: Partial<PartnerShop>) {
    shop_id = shop_id ?? doc(collection(db, 'partners', partner_id, 'shops')).id
    super(partner_id, shop_id, { ...src, partner_id })
  }
}

export class BokudeliPartnerMenu extends PartnerMenu {
  constructor(partner_id: string, menu_id: string | null, src: Partial<PartnerMenu>) {
    menu_id = menu_id ?? doc(collection(db, 'partners', partner_id, 'menus')).id
    super(partner_id, menu_id, { ...src })
  }
}

const shopConverter: FirestoreDataConverter<BokudeliPartnerShop> = {
  toFirestore(shop: BokudeliPartnerShop): DocumentData {
    return shop.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): BokudeliPartnerShop {
    const data = snapshot.data(options)
    const partner_id = snapshot.ref.parent.parent!.id
    return new BokudeliPartnerShop(partner_id, snapshot.id, data)
  },
}
const menuConverter: FirestoreDataConverter<BokudeliPartnerMenu> = {
  toFirestore: (menu: BokudeliPartnerMenu): DocumentData => {
    return menu.toFirestore()
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    const data = snapshot.data(options)
    const partner_id = snapshot.ref.parent.parent!.id
    return new BokudeliPartnerMenu(partner_id, snapshot.id, data)
  },
}

const db = getFirestore()

type PartnerStoreState = StateTree

type PartnerStoreGetters = {
  shops: Ref<BokudeliPartnerShop[] | null>
  menus: Ref<BokudeliPartnerMenu[] | null>
}

type PartnerStoreAction = {
  updateShop: (data: BokudeliPartnerShop, image?: File) => Promise<void>
  updateMenu: (data: BokudeliPartnerMenu, image?: File) => Promise<void>
  deleteMenu: (menuId: string) => Promise<void>
  unsubscribe: () => void
}

export type PartnerStore = Store<string, PartnerStoreState, PartnerStoreGetters, PartnerStoreAction>
export const usePartnerStore = (partnerId: string): PartnerStore => {
  const store = defineStore<string, PartnerStoreState & PartnerStoreGetters & PartnerStoreAction>(
    `/partners/${partnerId}`,
    () => {
      const partnerRef: DocumentReference = doc(db, 'partners', partnerId)
      const _shops = ref<BokudeliPartnerShop[] | null>(null)
      const _menus = ref<BokudeliPartnerMenu[] | null>(null)

      let unsubscribeShops: Unsubscribe | null = null
      const subscribeShops = () => {
        if (unsubscribeShops == null) {
          unsubscribeShops = onSnapshot(
            collection(partnerRef, 'shops').withConverter(shopConverter),
            (shopsSnapshot) => {
              _shops.value = shopsSnapshot.docs.flatMap((shopDoc) => {
                try {
                  return shopDoc.data()
                } catch (err) {
                  console.error(err)
                  return []
                }
              })
            },
          )
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
            query(collection(partnerRef, 'menus'), orderBy('updatedAt', 'desc')).withConverter(menuConverter),
            (menusSnapshot) => {
              _menus.value = menusSnapshot.docs.flatMap((menuDoc) => {
                try {
                  return menuDoc.data()
                } catch (err) {
                  console.error(err)
                  return []
                }
              })
            },
          )
        }
      }

      const menus = computed(() => {
        subscribeMenus()
        return _menus.value
      })

      const updateShop = async (data: BokudeliPartnerShop, image?: File) => {
        if (image != null) {
          data.shop_image_url = (await uploadShopImage(partnerRef.id, data.shop_id, image)) ?? ''
        }
        const shopRef = doc(partnerRef, 'shops', data.shop_id).withConverter(shopConverter)
        return await setDoc(shopRef, data)
      }

      const updateMenu = async (data: BokudeliPartnerMenu, image?: File) => {
        if (image != null) {
          data.menu_image_url = (await uploadMenuImage(partnerRef.id, data.id, image)) ?? ''
        }
        const menuRef = doc(partnerRef, 'menus', data.id).withConverter(menuConverter)
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
