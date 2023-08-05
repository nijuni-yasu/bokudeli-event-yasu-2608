type BokudeliCommunity = {
  communityId: string
  communityName: string
  communityAccount: string
  communityCoverImageUrl: string
  communityIconImageUrl: string
  communityDescription: string
  communitySns: {
    officialsite: string
    facebook: string
    instagram: string
    twitter: string
  }
  isPublic: boolean
}

export default BokudeliCommunity
