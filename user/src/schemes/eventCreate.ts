export interface BasicInfo {
  title: string
  postcode: string
  address: string
  placeName: string
  placeUrl: string
  startDateTime: Date | null
  endDateTime: Date | null
}

export interface ShopNotice {
  organizerFullName: string
  organizerCompany: string
  organizerPhonePersonal: string
  organizerPhoneCompany: string
  organizerEmail: string
  organizerMemo: string
}

export const hourList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
export const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
