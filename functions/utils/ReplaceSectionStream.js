import { Transform } from 'stream';

export class ReplaceSectionStream extends Transform {
  #beginMarker;
  #endMarker;
  #replacementText;
  #buffer;
  #isReplacing;

  constructor(beginMarker, endMarker, replacementText) {
    super();
    this.#beginMarker = beginMarker;
    this.#endMarker = endMarker;
    this.#replacementText = replacementText;
    this.#buffer = '';
    this.#isReplacing = false;
  }

  _transform(chunk, _, callback) {
    this.#buffer += chunk.toString();

    // 置換処理
    let index;
    while ((index = this.#isReplacing ? this.#buffer.indexOf(this.#endMarker) : this.#buffer.indexOf(this.#beginMarker)) !== -1) {
      if (this.#isReplacing) {
        // END マーカーを見つけた場合
        this.push(this.#replacementText);
        this.push(this.#endMarker);
        this.#buffer = this.#buffer.slice(index + this.#endMarker.length);
        this.#isReplacing = false;
      } else {
        // BEGIN マーカーを見つけた場合
        this.push(this.#buffer.slice(0, index));
        this.push(this.#beginMarker);
        this.#buffer = this.#buffer.slice(index + this.#beginMarker.length);
        this.#isReplacing = true;
      }
    }

    if (!this.#isReplacing) {
      // 置換中でなければバッファの内容をすべて送信
      this.push(this.#buffer);
      this.#buffer = '';
    }

    callback();
  }

  _flush(callback) {
    // ストリーム終了時に残りのバッファを処理
    if (this.#isReplacing) {
      // 置換中であれば、置換テキストを送信
      this.push(this.#replacementText + this.#buffer.split(this.#endMarker)[1]);
    } else {
      this.push(this.#buffer);
    }
    callback();
  }
}
