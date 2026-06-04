import { breakpointsVuetify } from '@vueuse/core'
import { VIcon } from 'vuetify/components/VIcon'
import { defineThemeConfig } from '@core'
import { Skins } from '@core/enums'

import logo from '@/assets/images/shokujii/shokujii_logo_wide.png'

import { AppContentLayoutNav, ContentWidth, FooterType, NavbarType } from '@layouts/enums'
export const { themeConfig, layoutConfig } = defineThemeConfig({
  app: {
    title: '',

    logo: h('img', { src: logo, class: 'logo' }),

    contentWidth: ContentWidth.Boxed,
    contentLayoutNav: AppContentLayoutNav.Vertical,
    overlayNavFromBreakpoint: breakpointsVuetify.md + 16, // 16 for scrollbar. Docs: https://next.vuetifyjs.com/en/features/display-and-platform/
    i18n: {
      enable: true,
      defaultLocale: 'ja',
      langConfig: [
        {
          label: 'Japanese',
          i18nLang: 'ja',
          isRTL: false,
        },
      ],
    },
    theme: 'light',
    skin: Skins.Default,
    iconRenderer: VIcon,
  },
  navbar: {
    type: NavbarType.Sticky,
    navbarBlur: true,
  },
  footer: { type: FooterType.Static },
  verticalNav: {
    isVerticalNavCollapsed: false,
    defaultNavItemIconProps: { icon: null },
    isVerticalNavSemiDark: false,
  },
  horizontalNav: {
    type: 'sticky',
    transition: 'slide-y-reverse-transition',
    popoverOffset: 4,
  },

  /*
  // ℹ️  In below Icons section, you can specify icon for each component. Also you can use other props of v-icon component like `color` and `size` for each icon.
  // Such as: chevronDown: { icon: 'ri-arrow-down-s-line', color:'primary', size: '24' },
  */
  icons: {
    chevronDown: { icon: null },
    chevronRight: { icon: null },
    close: { icon: null },
    verticalNavPinned: { icon: null },
    verticalNavUnPinned: { icon: null },
    sectionTitlePlaceholder: { icon: null },
  },
})
