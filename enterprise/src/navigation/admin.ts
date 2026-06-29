import type { NavLink } from '@layouts/types'
import {
  getAdminAuditLogsPath,
  getAdminCommunitiesPath,
  getAdminDashboardPath,
  getAdminInvoicesPath,
  getAdminMembersPath,
  getAdminSettingsPath,
} from '@/router/utils'
import {
  mdiAccountGroup,
  mdiClipboardTextClock,
  mdiCog,
  mdiOfficeBuildingCog,
  mdiReceipt,
  mdiViewDashboard,
} from '@mdi/js'

export const useAdminNavItems = (): NavLink[] => {
  const { t: $t } = useI18n()
  return [
    {
      title: $t('admin.navigation.dashboard'),
      to: { path: getAdminDashboardPath() },
      icon: { icon: mdiViewDashboard },
    },
    {
      title: $t('admin.navigation.invoices'),
      to: { path: getAdminInvoicesPath() },
      icon: { icon: mdiReceipt },
    },
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
      title: $t('admin.navigation.audit_logs'),
      to: { path: getAdminAuditLogsPath() },
      icon: { icon: mdiClipboardTextClock },
    },
  ]
}
