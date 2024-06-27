// export type PartnerMenu = {
//   id: string
//   partnerId: string
//   name: string
//   price: number
//   imageUrl: string
//   description: string
//   createdAt: Date | null
//   updatedAt: Date | null
//   isSoldout?: boolean
//   dateStart?: string
//   dateEnd?: string
// }

export class PartnerMenu {
  constructor(
    public partnerId: string,
    public id: string | null = null,
    public name: string = '',
    public price: number = 100,
    public imageUrl: string | null = null,
    public description: string = '',
    public createdAt: Date | null = null,
    public updatedAt: Date | null = null,
    public isSoldout: boolean = false,
    public dateStart: string | null = null,
    public dateEnd: string | null = null,
    public stockPerEvent?: number,
  ) {}
}
