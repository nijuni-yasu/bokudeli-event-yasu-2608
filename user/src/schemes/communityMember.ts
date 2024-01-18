import { FirestoredUser } from './storedUser'

export type CommunityMember = FirestoredUser & {
    roles?: string[]
}
  