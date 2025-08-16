declare module '@core/utils/helpers' {
  export function isEmpty(value: unknown): boolean;
}

declare module '@core/utils/validators' {
  export function emailValidator(value: unknown): boolean | string;
  export function requiredValidator(value: unknown): string | true;
  export function urlValidator(value: unknown): string | true;
  export function betweenValidator(value: unknown, min: number, max: number): string | true;
}

declare module '@core' {
  export function defineThemeConfig(config: any): any;
}

declare module '@core/enums' {
  export enum Skins {
    Default = 'default',
    Bordered = 'bordered'
  }
}
