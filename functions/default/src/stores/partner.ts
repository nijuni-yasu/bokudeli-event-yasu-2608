import {
  getFirestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  Transaction,
} from 'firebase-admin/firestore'
import { PartnerMenu } from '@shokujii/common/schemas/PartnerMenu.js'
import { PartnerShop } from '@shokujii/common/schemas/PartnerShop.js'
import { Event } from '@shokujii/common/schemas/Event.js'

class PartnerMenuConverter implements FirestoreDataConverter<PartnerMenu> {
  toFirestore(order: PartnerMenu): DocumentData {
    return order.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): PartnerMenu {
    const partnerId = snapshot.ref.parent.parent!.id
    return new PartnerMenu(partnerId, snapshot.id, snapshot.data())
  }
}

class PartnerShopConverter implements FirestoreDataConverter<PartnerShop> {
  toFirestore(order: PartnerShop): DocumentData {
    return order.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): PartnerShop {
    const partnerId = snapshot.ref.parent.parent!.id
    return new PartnerShop(partnerId, snapshot.id, snapshot.data())
  }
}

export class Partner {
  constructor(readonly id: string) {}

  async getMenus(transaction?: Transaction): Promise<PartnerMenu[]> {
    const db = getFirestore()
    const menusRef = db
      .collection('partners')
      .doc(this.id)
      .collection('menus')
      .withConverter(new PartnerMenuConverter())
    const snapshot = await (transaction === undefined ? menusRef.get() : transaction.get(menusRef))
    return snapshot.docs.map((doc) => doc.data())
  }

  async getMenu(menuId: string, transaction?: Transaction): Promise<PartnerMenu | undefined> {
    const db = getFirestore()
    const menuRef = db
      .collection('partners')
      .doc(this.id)
      .collection('menus')
      .doc(menuId)
      .withConverter(new PartnerMenuConverter())
    const snapshot = await (transaction === undefined ? menuRef.get() : transaction.get(menuRef))
    return snapshot.data()
  }

  async saveMenu(menu: PartnerMenu, transaction?: Transaction): Promise<void> {
    const db = getFirestore()
    const menusRef = db
      .collection('partners')
      .doc(this.id)
      .collection('menus')
      .withConverter(new PartnerMenuConverter())
    if (transaction === undefined) {
      await menusRef.doc(menu.id).set(menu, { merge: true })
    } else {
      transaction.set(menusRef.doc(menu.id), menu, { merge: true })
    }
  }

  async getShops(transaction?: Transaction): Promise<PartnerShop[]> {
    const db = getFirestore()
    const shopsRef = db
      .collection('partners')
      .doc(this.id)
      .collection('shops')
      .withConverter(new PartnerShopConverter())

    const snapshot = await (transaction === undefined ? shopsRef.get() : transaction.get(shopsRef))
    return snapshot.docs.map((doc) => doc.data())
  }

  async getShop(shopId: string, transaction?: Transaction): Promise<PartnerShop | undefined> {
    const db = getFirestore()
    const shopRef = db
      .collection('partners')
      .doc(this.id)
      .collection('shops')
      .doc(shopId)
      .withConverter(new PartnerShopConverter())
    const snapshot = await (transaction === undefined ? shopRef.get() : transaction.get(shopRef))
    return snapshot.data()
  }

  async saveShop(shop: PartnerShop, transaction?: Transaction): Promise<void> {
    const db = getFirestore()
    const shopsRef = db
      .collection('partners')
      .doc(this.id)
      .collection('shops')
      .withConverter(new PartnerShopConverter())
    if (transaction === undefined) {
      await shopsRef.doc(shop.id).set(shop, { merge: true })
    } else {
      transaction.set(shopsRef.doc(shop.id), shop, { merge: true })
    }
  }
}

export const getPartner = async (id: string): Promise<Partner> => {
  // TODO パートナーが存在するかどうかを確認する
  return new Partner(id)
}

export const getEventPartnerShop = async (
  event: Event,
  transaction?: Transaction,
): Promise<PartnerShop | undefined> => {
  const db = getFirestore()
  const shopRef = db
    .collection('partners')
    .doc(event.partner_id)
    .collection('shops')
    .doc(event.shop_id)
    .withConverter(new PartnerShopConverter())
  const snapshot = await (transaction === undefined ? shopRef.get() : transaction.get(shopRef))
  return snapshot.data()
}
