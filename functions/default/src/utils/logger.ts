import { logger } from 'firebase-functions'

/**
 * firebase-functions の logger と同じインターフェースで jsonPayload.module を自動付与するロガーを生成する。
 * デコレーターパターンにより、呼び出し側のコードを変えずに module フィールドの付与を追加している。
 * 呼び出し例：const logger = createModuleLogger('letter')
 *
 * 複数モジュールが同一 Function 内で動作する場合に、Cloud Logging でモジュール単位のフィルタリングが可能になる。
 * Logs Explorer クエリ例: jsonPayload.module="letter"
 */
export function createModuleLogger(module: string) {
  return {
    info: (message: string, data?: object) => logger.info(message, { ...data, module }),
    warn: (message: string, data?: object) => logger.warn(message, { ...data, module }),
    error: (message: string, data?: object) => logger.error(message, { ...data, module }),
  }
}
