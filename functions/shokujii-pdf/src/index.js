import path from 'path'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { onRequest, HttpsError } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2/options'
import { defineString } from 'firebase-functions/params'
import { format } from 'date-fns'
import { makePdf } from './makePdf.js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import axios from 'axios'; 
import sharp from 'sharp';

setGlobalOptions({ region: 'asia-northeast1' })

initializeApp()
const db = getFirestore()
const storage = getStorage();

const convertDateToId = (date) => {
  return format(date, 'yyyyMMddHHmmss')
}
const convertDateToString = (date) => {
  return format(date, 'y/M/d')
}
const convertNumberToCurrency = (num) => {
  return '¥' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const CORS = defineString('CORS')

// __dirname を定義
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// default_profile.jpegをBase64エンコードする関数を修正
const getDefaultProfileBase64 = () => {
  const defaultProfilePath = path.join(__dirname, 'default_profile.jpeg')
  const defaultProfile = fs.readFileSync(defaultProfilePath)
  return `data:image/jpeg;base64,${defaultProfile.toString('base64')}`
}

// blank_profile.jpegをBase64エンコードする関数を修正
const getBlankProfileBase64 = () => {
  const blankProfilePath = path.join(__dirname, 'blank_profile.jpeg')
  const blankProfile = fs.readFileSync(blankProfilePath)
  return `data:image/jpeg;base64,${blankProfile.toString('base64')}`
}

// GCSから画像をダウンロードする関数
export const downloadImageFromGCS = async (gsUrl) => {
  const bucketName = gsUrl.split('/')[2];
  const filePath = gsUrl.split('/').slice(3).join('/');
  const bucket = storage.bucket(bucketName);
  
  try {
    const file = bucket.file(filePath);
    const [imageBuffer] = await file.download();
    return imageBuffer;
  } catch (error) {
    console.error('Error downloading image from GCS:', error);
    return null; // エラーが発生した場合はnullを返す
  }
};

// 写真URLの妥当性をチェックし、必要に応じてBase64エンコードする関数を修正
const isValidPhotoUrl = async (url) => {

  // gs://形式のURLの場合の処理
  if (url && typeof url === 'string' && url.startsWith('gs://')) {
    // GCSから画像をダウンロード
    const imageBuffer = await downloadImageFromGCS(url);
    if (imageBuffer == null) {
      return getDefaultProfileBase64();
    }

    const resizedBuffer = await  resizeAndCropImage(imageBuffer, 300, 300) 
    return resizedBuffer
  }

  if (!url || typeof url !== 'string' || !url.startsWith('https://')) return getDefaultProfileBase64();
  
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const photoBuffer = Buffer.from(response.data);
    
    const resizedBuffer = await  resizeAndCropImage(photoBuffer, 300, 300) 
    return resizedBuffer

  } catch (error) {
    console.error('Error fetching image:', error);
    return getDefaultProfileBase64();
  }
};

// 画像をリサイズ・クロップする関数
const resizeAndCropImage = async (imageBuffer, targetWidth, targetHeight) => {
  try {
    // 元の画像のメタデータを取得
    const metadata = await sharp(imageBuffer).metadata();
    const originalAspectRatio = metadata.width / metadata.height;
    const targetAspectRatio = targetWidth / targetHeight;

    let resizeOptions = {};
    let extractOptions = {};

    if (originalAspectRatio > targetAspectRatio) {
      // 横長の画像の場合
      const newHeight = targetHeight;
      const newWidth = Math.round(newHeight * originalAspectRatio);
      
      resizeOptions = {
        width: newWidth,
        height: newHeight,
        fit: 'fill'
      };
      
      // 中央部分を切り抜く
      const extractX = Math.round((newWidth - targetWidth) / 2);
      extractOptions = {
        left: extractX,
        top: 0,
        width: targetWidth,
        height: targetHeight
      };
    } else if (originalAspectRatio < targetAspectRatio) {
      // 縦長の画像の場合
      const newWidth = targetWidth;
      const newHeight = Math.round(newWidth / originalAspectRatio);
      
      resizeOptions = {
        width: newWidth,
        height: newHeight,
        fit: 'fill'
      };
      
      // 中央部分を切り抜く
      const extractY = Math.round((newHeight - targetHeight) / 2);
      extractOptions = {
        left: 0,
        top: extractY,
        width: targetWidth,
        height: targetHeight
      };
    } else {
      // アスペクト比が同じ場合は単純にリサイズ
      resizeOptions = {
        width: targetWidth,
        height: targetHeight,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // 白背景
      };
    }

    // 画像の処理
    const processedBuffer = await sharp(imageBuffer)
      .resize(resizeOptions)
      .extract(extractOptions)
      .toBuffer();

    return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error processing image:', error);
    // エラー時は元の画像をそのままBase64エンコード
    try {
      const simpleResized = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toBuffer();
      return `data:image/jpeg;base64,${simpleResized.toString('base64')}`;
    } catch (fallbackError) {
      console.error('Fallback resize failed:', fallbackError);
      // 最後の手段として元の画像をそのままBase64エンコード
      return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    }
  }
};

export const invoice = onRequest({ cors: [CORS.value()] }, async (req, res) => {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('JWT ')) {
    throw new HttpsError('unauthenticated', 'JWT token is required')
  }

  const idToken = authHeader.split('JWT ')[1]
  const decodedToken = await getAuth().verifyIdToken(idToken)
  const uid = decodedToken.uid

  const [, eventId, orderId] = req.path.split('/')
  console.info(`uid: ${uid}, eventId: ${eventId}, orderId: ${orderId}`)

  const jsonDataForMerge = await db.runTransaction(async (transaction) => {
    const events = await transaction.get(db.collectionGroup('events').where('event_id', '==', eventId))
    if (events.size !== 1) {
      res.status(404).send('Event not found')
      return
    }

    const event = events.docs[0]
    const [order, shop] = await Promise.all([
      transaction.get(event.ref.collection('orders').doc(orderId)),
      transaction.get(
        db.collection('partners').doc(event.data().partner_id).collection('shops').doc(event.data().shop_id),
      ),
    ])

    if (order.data().user_id !== uid) {
      res.status(403).send('Forbidden')
      return
    }

    const price = order.data()?.menus?.reduce((acc, v) => (acc += v.price * v.count), 0)
    const date = order.data()?.ordered_at?.toDate()
    if (price == null || Number.isNaN(price) || order.data().status !== 'ordered' || date == null) {
      res.status(404).send('Order not found')
      return
    }
    const rawPrice = Math.ceil(price / 1.08)
    const tax = price - rawPrice

    let reissue = true
    let number = order.data().receipt_number
    if (number == null) {
      reissue = false
      number = convertDateToId(date)
      transaction.update(order.ref, { receipt_number: number })
    }

    return {
      event: event.data().event_name + ' / お食事代として',
      number,
      orderDate: convertDateToString(date),
      price: convertNumberToCurrency(price),
      date: convertDateToString(new Date()),
      shop: shop.data().shop_name,
      invoiceId: shop.data().shop_invoice_number ?? 'なし',
      address: shop.data().shop_address,
      rawPrice: convertNumberToCurrency(rawPrice),
      tax: convertNumberToCurrency(tax),
      reissue,
    }
  })

  res.status(200).setHeader('Content-Type', 'application/pdf')
  makePdf(path.join('template', 'invoice.docx'), jsonDataForMerge, res)
})

export const namesSheet = onRequest({ cors: [CORS.value()] }, async (req, res) => {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('JWT ')) {
    throw new HttpsError('unauthenticated', 'JWT token is required')
  }

  const idToken = authHeader.split('JWT ')[1]
  const decodedToken = await getAuth().verifyIdToken(idToken)
  const uid = decodedToken.uid

  const [, eventId] = req.path.split('/')
  console.info(`uid: ${uid}, eventId: ${eventId}`)

  const jsonDataForMerge = await db.runTransaction(async (transaction) => {
    const event = await getEvent(transaction, eventId)
    if (!event) {
      res.status(404).send('Event not found')
      return
    }

    const menuUsers = await getMenuUsers(transaction, event)
    const userMap = await getUserMap(transaction, menuUsers)

    const validNames = await createValidNames(menuUsers, userMap)
    const filteredValidNames = validNames.filter(item => item.name || item.menu)

    return createTemplateData(filteredValidNames)
  })

  // PDFの生成と送信
  res.status(200).setHeader('Content-Type', 'application/pdf')
  await makePdf(path.join('template', 'namesSheet.docx'), jsonDataForMerge, res)
})

// イベントを取得する関数
const getEvent = async (transaction, eventId) => {
  const events = await transaction.get(db.collectionGroup('events').where('event_id', '==', eventId))
  return events.size === 1 ? events.docs[0] : null
}

// メニューと注文者情報を取得する関数
const getMenuUsers = async (transaction, event) => {
  const ordersSnapshot = await transaction.get(event.ref.collection('orders').where('status', '==', 'ordered'))
  const menuUsers = []
  ordersSnapshot.forEach(orderDoc => {
    const orderData = orderDoc.data()
    orderData.menus.forEach(menu => {
      for (let i = 0; i < menu.count; i++) {
        menuUsers.push({
          userId: orderData.user_id,
          menuName: menu.name.normalize('NFKC'),
          menuId: menu.menu_id,
          orderedAt: orderData.ordered_at?.toMillis() || 0
        })
      }
    })
  })
  // メニュー名昇順、注文日時昇順でソート
  menuUsers.sort((a, b) => {
    if (a.menuName === b.menuName) {
      return a.orderedAt - b.orderedAt; // 注文日時でソート
    }
    return a.menuName.localeCompare(b.menuName); // メニュー名でソート
  });

  return menuUsers
}

// ユーザー情報をマップとして取得する関数
const getUserMap = async (transaction, menuUsers) => {
  const userIds = new Set(menuUsers.map(menuUser => menuUser.userId))
  const usersSnapshot = await transaction.get(db.collection('users').where('user_id', 'in', Array.from(userIds)))
  
  const userMap = {}
  usersSnapshot.forEach(doc => {
    const userData = doc.data()
    userMap[userData.user_id] = {
      userName: userData.user_name,
      photo: userData.user_image_url
    }
  })
  return userMap
}

// 有効な名前の配列を作成する関数
const createValidNames = async (menuUsers, userMap) => {

  return Promise.all(menuUsers.map(async (menuUser, index) => {
    const photoUrl = userMap[menuUser.userId]?.photo
    return {
      name: userMap[menuUser.userId]?.userName?.length > 14
        ? userMap[menuUser.userId]?.userName.slice(0, 14)
        : userMap[menuUser.userId]?.userName || '',
      menu: menuUser.menuName.length > 28 
        ? menuUser.menuName.slice(0, 28) + '…' 
        : menuUser.menuName,
      photo: await isValidPhotoUrl(photoUrl),
      position: index
    }
  }))
}

// テンプレートデータを作成する関数
const createTemplateData = (filteredValidNames) => {
  const templateData = { d: [] }
  // filteredValidNamesを4人ずつのグループに分けるループ（テンプレートが1行に４列あるため）
  for (let i = 0; i < filteredValidNames.length; i += 4) {
    const group = {}
    // グループオブジェクトに人物の情報を追加
    for (let j = 0; j < 4 && (i + j) < filteredValidNames.length; j++) {
      const person = filteredValidNames[i + j]
      const num = j + 1
      group[`index${num}`] = i + j + 1
      group[`name${num}`] = person.name.normalize('NFKC')
      group[`menu${num}`] = person.menu.normalize('NFKC')
      group[`photo${num}`] = person.photo || getDefaultProfileBase64()
    }
    // 4人に満たない場合は空データで埋める
    for (let j = filteredValidNames.length % 4; j < 4 && i + 4 > filteredValidNames.length; j++) {
      const num = j + 1
      group[`index${num}`] = i + j + 1
      group[`name${num}`] = ' '
      group[`menu${num}`] = ' '
      group[`photo${num}`] = getBlankProfileBase64()
    }
    templateData.d.push(group)
  }

  return templateData
}
