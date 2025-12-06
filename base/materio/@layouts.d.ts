declare module '@layouts/components/VNodeRenderer' {
  import { Component } from 'vue';
  
  export const VNodeRenderer: Component<{
    nodes: any;
  }>;
}

declare module '@layouts' {
  import { Component } from 'vue';
  
  export const HorizontalNavLayout: Component<{
    navItems: any[];
  }>;
  
  export const VerticalNavLayout: Component<{
    navItems: any[];
  }>;
  
  export function createLayouts(config: any): any;
}

declare module 'virtual:generated-layouts' {
  export function setupLayouts(routes: any[]): any[];
}

declare module 'vue-router/auto' {
  export function createRouter(options: any): any;
  export function createWebHistory(base?: string): any;
  export type Router = any;
}

declare module '@layouts/types' {
  export type HorizontalNavItems = any[];
  export type VerticalNavItems = any[];
}

declare module '@layouts/enums' {
  export enum AppContentLayoutNav {
    Horizontal = 'horizontal',
    Vertical = 'vertical'
  }
  
  export enum ContentWidth {
    Boxed = 'boxed',
    Fluid = 'fluid'
  }
  
  export enum FooterType {
    Static = 'static',
    Sticky = 'sticky',
    Hidden = 'hidden'
  }
  
  export enum NavbarType {
    Sticky = 'sticky',
    Static = 'static',
    Hidden = 'hidden'
  }
}
