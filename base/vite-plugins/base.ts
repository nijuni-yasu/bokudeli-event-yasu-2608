// @ts-expect-error - TypeScript doesn't know the location of the file
import type { PluginContext, ResolveIdResult } from 'rollup'
import path from 'node:path'

/**
 * base dir 内のモジュールが node_modules を参照するための処理
 * @returns
 */
export function baseModule(rootDir: string) {
    return {
      name: 'base-module',
      async resolveId(this: PluginContext, id: string, importer: string): Promise<ResolveIdResult>  {
        const targetPath = path.relative(rootDir, importer)
        if (targetPath.startsWith('../base')) {
          return await this.resolve(id, targetPath.replace('../base', path.resolve(rootDir, 'src')))
        }
        return null
      },
    }
  }
  