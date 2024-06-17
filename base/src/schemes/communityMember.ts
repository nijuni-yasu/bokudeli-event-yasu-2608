import _ from 'lodash'
import { type DocumentData } from 'firebase/firestore'
import { FirestoredUser } from './storedUser'

export type CommunityMember = FirestoredUser & {
    roles?: string[]
}

// TODO: CommunityMember のメソッドとして実装したほうが使い勝手は良さそう
export const convertCommunityMemberToDocumentData = (member: Partial<CommunityMember>): DocumentData => {
    return _.pick(member, 'roles')
}