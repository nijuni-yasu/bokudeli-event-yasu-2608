export interface BasicInfo {
  postcode: string
  address: string
  title: string
  startDateTime: Date | null
  endDateTime: Date | null
}

export const hourList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
export const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
