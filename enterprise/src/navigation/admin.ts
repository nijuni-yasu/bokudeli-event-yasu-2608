import type { NavLink } from '@layouts/types'
import {
  getAdminCommunitiesPath,
  getAdminDiscountPath,
  getAdminMembersPath,
  getAdminSettingsPath,
} from '@/router/utils'
import { mdiAccountGroup, mdiCog, mdiOfficeBuildingCog, mdiSale } from '@mdi/js'

export const useAdminNavItems = (): NavLink[] => {
  const { t: $t } = useI18n()
  return [
    {
      title: $t('admin.navigation.settings'),
      to: { path: getAdminSettingsPath() },
      icon: { icon: mdiCog },
    },
    {
      title: $t('admin.navigation.members'),
      to: { path: getAdminMembersPath() },
      icon: { icon: mdiAccountGroup },
    },
    {
      title: $t('admin.navigation.communities'),
      to: { path: getAdminCommunitiesPath() },
      icon: { icon: mdiOfficeBuildingCog },
    },
    {
      title: $t('admin.navigation.discount'),
      to: { path: getAdminDiscountPath() },
      icon: { icon: mdiSale },
    },
  ]
}
