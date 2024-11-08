<script setup lang="ts">
  import facebook from '@/assets/images/sns/sns_facebook.png'
  import instagram from '@/assets/images/sns/sns_instagram.png'
  import line from '@/assets/images/sns/sns_line.png'
  import note from '@/assets/images/sns/sns_note.png'
  import X from '@/assets/images/sns/sns_x.png'
</script>

<template>
  <div class="mt-15 mb-5 text-center">
    <div class="my-5 text-center">
      <span class="align-center">
        ＼最新情報はSNSをチェック／
      </span>
    </div>
    <table align="center" style="margin: auto;">
        <tr>
          <td style="padding: 0 10px;">
            <a href="https://x.com/shokujii_jp" target="_blank">
              <img :src="X" alt="X" style="width: 45px; height: 45px; border-radius: 20%;">
            </a>
          </td>
          <td style="padding: 0 10px;">
            <a href="https://facebook.com/shokujii" target="_blank">
              <img :src="facebook" alt="Facebook" style="width: 45px; height: 45px; border-radius: 20%;">
            </a>
          </td>
          <td style="padding: 0 10px;">
            <a href="https://instagram.com/shokujii_jp" target="_blank">
              <img :src="instagram" alt="Instagram" style="width: 45px; height: 45px; border-radius: 20%;">
            </a>
          </td>
          <td style="padding: 0 10px;">
            <a href="https://note.com/shokujii/" target="_blank">
              <img :src="note" alt="note" style="width: 45px; height: 45px; border-radius: 20%;">
            </a>
          </td>
          <td style="padding: 0 10px;">
            <a href="https://lin.ee/0FEi1kbV/" target="_blank">
              <img :src="line" alt="LINE" style="width: 45px; height: 45px; border-radius: 20%;">
            </a>
          </td>
        </tr>
    </table>
  </div>
  <div class="my-5 text-center">
    <span class="align-center">
      <a href="https://shokujii.studio.site/" target="_blank" rel="noopener noreferrer" class="footer-text">
        shokujiiって？
      </a>
      <a href="https://shokujii.studio.site/restaurant" target="_blank" rel="noopener noreferrer" class="footer-text">
        飲食店パートナーになる
      </a>
      <a
        href="https://about.shokujii.jp/howto"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-text"
      >
        ヘルプ（使い方動画）
      </a>
      <a
        href="https://nijuni.notion.site/shokujii-FAQ-9be74ae1230a41788f0714f302714989"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-text"
      >
        FAQ
      </a>
      <a href="https://bit.ly/3S3L8Sv" target="_blank" rel="noopener noreferrer" class="footer-text">
        コミュニティガイド
      </a>
      <br />
      <a
        href="https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-text"
      >
        利用規約
      </a>
      <a
        href="https://nijuni.notion.site/shokujii-26a5f4507e5343329d2b7c6bea51030b"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-text"
      >
        プライバシーポリシー
      </a>
      <a
        href="https://nijuni.notion.site/a761c206d7704b5caa4058c6c3f8fff7"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-text"
      >
        特定商取引法に基づく表記
      </a>
      <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank" rel="noopener noreferrer" class="footer-text">
        お問い合わせ
      </a>
      <a href="https://nijuni.jp/" target="_blank" rel="noopener noreferrer" class="footer-text"> 運営会社 </a>
    </span>
  </div>
  <div class="text-center" style="font-size:9px;">令和２年度補正ものづくり補助金により作成</div>
  <div class="mb-3 text-center" style="font-size:16px;">
    &copy;
    {{ new Date().getFullYear() }}
    nijuni inc.
  </div>
</template>
<style scoped>
.footer-text {
  font-size: 12px;
  margin: 4px;
}
</style>
