import { type MaybeRefOrGetter, toValue } from 'vue'
import type { ProfileLinkPolicyFn } from '@shokujii/base/types/profilePathResolvers.js'

export const useProfileLinkPolicy = (isOwner: MaybeRefOrGetter<boolean>): { canLinkToDetail: ProfileLinkPolicyFn } => {
  const canLinkToDetail: ProfileLinkPolicyFn = (isPublic: boolean, isLinkable?: boolean) =>
    isLinkable ?? (toValue(isOwner) || isPublic)

  return { canLinkToDetail }
}
