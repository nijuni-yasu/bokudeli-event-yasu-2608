declare module '@themeConfig' {
  export const themeConfig: {
    app: {
      title: string;
      logo: any; // VNode
      contentWidth: any;
      contentLayoutNav: any;
      overlayNavFromBreakpoint: number;
      i18n: {
        enable: boolean;
        defaultLocale: string;
        langConfig: Array<{
          label: string;
          i18nLang: string;
          isRTL: boolean;
        }>;
      };
      theme: string;
      skin: any;
      iconRenderer: any;
    };
    navbar: {
      type: any;
      navbarBlur: boolean;
    };
    footer: {
      type: any;
    };
    verticalNav: {
      isVerticalNavCollapsed: boolean;
      defaultNavItemIconProps: { icon: any };
      isVerticalNavSemiDark: boolean;
    };
    horizontalNav: {
      type: string;
      transition: string;
      popoverOffset: number;
    };
    icons: {
      chevronDown: { icon: any };
      chevronRight: { icon: any };
      close: { icon: any };
      verticalNavPinned: { icon: any };
      verticalNavUnPinned: { icon: any };
      sectionTitlePlaceholder: { icon: any };
    };
  };
  
  export const layoutConfig: any;
}
