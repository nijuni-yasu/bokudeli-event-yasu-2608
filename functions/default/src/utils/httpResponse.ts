/** onRequest ハンドラが利用する Response の最小インターフェース（@types/express のバージョン差異を避ける） */
export type HttpResponse = {
  status(code: number): HttpResponse
  set(field: string, value?: string | number): HttpResponse
  setHeader(name: string, value: string | number | readonly string[]): HttpResponse
  send(body?: unknown): unknown
  json(body: unknown): unknown
  readonly headersSent: boolean
}
