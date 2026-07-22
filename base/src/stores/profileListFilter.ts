import { where, type QueryConstraint } from 'firebase/firestore'

export type ProfileListFilter = { kind: 'none' } | { kind: 'pf-null' } | { kind: 'enterprise'; enterpriseId: string }

export const profileListFilterKey = (filter: ProfileListFilter): string => {
  switch (filter.kind) {
    case 'none':
      return 'none'
    case 'pf-null':
      return 'pf-null'
    case 'enterprise':
      return `enterprise/${filter.enterpriseId}`
  }
}

export const profileListFilterToConstraints = (filter: ProfileListFilter): QueryConstraint[] => {
  switch (filter.kind) {
    case 'none':
      return []
    case 'pf-null':
      return [where('enterprise_id', '==', null)]
    case 'enterprise':
      return [where('enterprise_id', '==', filter.enterpriseId)]
  }
}
