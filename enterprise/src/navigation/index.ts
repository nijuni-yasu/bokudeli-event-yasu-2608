import type { NavLink, NavGroup } from '@layouts/types'
import { getHomePath, getCommunityListPath, getManagePath, getAdminDashboardPath } from '@/router/utils'
import { mdiSilverwareForkKnife, mdiAccountGroup, mdiPartyPopper, mdiViewDashboard } from '@mdi/js'
import { getAuth } from 'firebase/auth'
import { isEnterpriseAdmin } from '@/composable/useEnterpriseAdmin'

export const useNavItems = () => {
  const { t: $t } = useI18n()
  const showAdminMenu = ref(false)

  let unsubscribeAuth: (() => void) | undefined

  const refreshAdminMenu = async () => {
    showAdminMenu.value = await isEnterpriseAdmin()
  }

  onMounted(() => {
    void refreshAdminMenu()
    unsubscribeAuth = getAuth().onAuthStateChanged(() => {
      void refreshAdminMenu()
    })
  })
  onUnmounted(() => {
    unsubscribeAuth?.()
  })

  return computed((): (NavLink | NavGroup)[] => {
    const items: (NavLink | NavGroup)[] = [
      {
        title: $t('navigation.home'),
        to: { path: getHomePath() },
        icon: { icon: mdiSilverwareForkKnife },
      },
      {
        title: $t('navigation.community'),
        to: { path: getCommunityListPath() },
        icon: { icon: mdiAccountGroup },
      },
      {
        title: $t('navigation.new_event'),
        to: { path: getManagePath() },
        icon: { icon: mdiPartyPopper },
      },
    ]

    if (showAdminMenu.value) {
      items.push({
        title: $t('navigation.manage'),
        to: { path: getAdminDashboardPath() },
        icon: { icon: mdiViewDashboard },
      })
    }

    return items
  })
}
