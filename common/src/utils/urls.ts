export const getCommunityInvitationUrl = (host: string, communityAccount: string, tokenId: string): string => {
  return `https://${host}/c/${communityAccount}/invites?t=${tokenId}`
}