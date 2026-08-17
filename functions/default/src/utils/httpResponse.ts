/**
 * onRequest ハンドラが利用する Response の最小インターフェース（@types/express のバージョン差異を避ける）。
 *
 * res 型の使い分け:
 * - `HttpResponse`: express 型に依存したくない onRequest ハンドラ（ogp / sitemap / stripeWebhook の一部）
 * - express `Response`（推論）: その他の onRequest ハンドラ（flyer / invoice 系 / slackbot 等）
 * - `Writable`: PDF 等をストリーム出力するヘルパー（`streamInvoicePdf` 等）
 */
export type HttpResponse = {
  status(code: number): HttpResponse
  set(field: string, value?: string | string[]): HttpResponse
  setHeader(name: string, value: string | number | readonly string[]): HttpResponse
  send(body?: unknown): HttpResponse
  json(body: unknown): HttpResponse
  readonly headersSent: boolean
}
