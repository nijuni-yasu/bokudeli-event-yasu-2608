type PartnerMenu = {
  id: string
  partnerId: string
  name: string
  price: number
  imageUrl: string
  description: string
  createdAt: Date | null
  updatedAt: Date | null
  isSoldout?: boolean
}

export default PartnerMenu
