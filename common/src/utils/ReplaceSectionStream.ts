import { Transform } from 'stream'

export class ReplaceSectionStream extends Transform {
  private beginMarker: string
  private endMarker: string
  private replacementText: string
  private buffer: string
  private isReplacing: boolean

  constructor(beginMarker: string, endMarker: string, replacementText: string) {
    super()
    this.beginMarker = beginMarker
    this.endMarker = endMarker
    this.replacementText = replacementText
    this.buffer = ''
    this.isReplacing = false
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: Function): void {
    this.buffer += chunk.toString()

    // 置換処理
    let index: number
    while (
      (index = this.isReplacing ? this.buffer.indexOf(this.endMarker) : this.buffer.indexOf(this.beginMarker)) !== -1
    ) {
      if (this.isReplacing) {
        // END マーカーを見つけた場合
        this.push(this.replacementText)
        this.push(this.endMarker)
        this.buffer = this.buffer.slice(index + this.endMarker.length)
        this.isReplacing = false
      } else {
        // BEGIN マーカーを見つけた場合
        this.push(this.buffer.slice(0, index))
        this.push(this.beginMarker)
        this.buffer = this.buffer.slice(index + this.beginMarker.length)
        this.isReplacing = true
      }
    }

    if (!this.isReplacing) {
      // 置換中でなければバッファの内容をすべて送信
      this.push(this.buffer)
      this.buffer = ''
    }

    callback()
  }

  _flush(callback: Function): void {
    // ストリーム終了時に残りのバッファを処理
    if (this.isReplacing) {
      // 置換中であれば、置換テキストを送信
      this.push(this.replacementText + this.buffer.split(this.endMarker)[1])
    } else {
      this.push(this.buffer)
    }
    callback()
  }
}
