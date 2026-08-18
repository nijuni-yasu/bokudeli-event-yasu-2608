<script setup lang="ts">
import { LEGAL_URLS } from '@shokujii/base/constants/legalUrls.js'
import facebook from '@/assets/images/sns/sns_facebook.png'
import instagram from '@/assets/images/sns/sns_instagram.png'
import line from '@/assets/images/sns/sns_line.png'
import note from '@/assets/images/sns/sns_note.png'
import X from '@/assets/images/sns/sns_x.png'

withDefaults(
  defineProps<{
    /** イベントページなどコンテンツ優先画面向け。リンク構成を簡略化 */
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <footer :class="compact ? 'site-footer site-footer--compact' : 'site-footer'">
    <div class="site-footer__sns text-center">
      <p class="site-footer__sns-heading">＼最新情報はSNSをチェック／</p>
      <div class="site-footer__sns-icons">
        <a href="https://x.com/shokujii_jp" target="_blank" rel="noopener noreferrer">
          <img :src="X" alt="X" class="site-footer__sns-icon" />
        </a>
        <a href="https://facebook.com/shokujii" target="_blank" rel="noopener noreferrer">
          <img :src="facebook" alt="Facebook" class="site-footer__sns-icon" />
        </a>
        <a href="https://instagram.com/shokujii_jp" target="_blank" rel="noopener noreferrer">
          <img :src="instagram" alt="Instagram" class="site-footer__sns-icon" />
        </a>
        <a href="https://note.com/shokujii/m/mc65c92109f2b" target="_blank" rel="noopener noreferrer">
          <img :src="note" alt="note" class="site-footer__sns-icon" />
        </a>
        <a href="https://lin.ee/0FEi1kbV/" target="_blank" rel="noopener noreferrer">
          <img :src="line" alt="LINE" class="site-footer__sns-icon" />
        </a>
      </div>
    </div>
    <div class="site-footer__links text-center">
      <template v-if="compact">
        <a href="https://shokujii.studio.site/" target="_blank" rel="noopener noreferrer" class="footer-text">
          shokujiiって？
        </a>
        <a :href="LEGAL_URLS.terms" target="_blank" rel="noopener noreferrer" class="footer-text"> 利用規約 </a>
        <a :href="LEGAL_URLS.privacy" target="_blank" rel="noopener noreferrer" class="footer-text">
          プライバシーポリシー
        </a>
        <a :href="LEGAL_URLS.commercial" target="_blank" rel="noopener noreferrer" class="footer-text">
          特定商取引法に基づく表記
        </a>
        <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank" rel="noopener noreferrer" class="footer-text">
          お問い合わせ
        </a>
        <a href="https://nijuni.jp/" target="_blank" rel="noopener noreferrer" class="footer-text"> 運営会社 </a>
      </template>
      <template v-else>
        <a href="https://shokujii.studio.site/" target="_blank" rel="noopener noreferrer" class="footer-text">
          shokujiiって？
        </a>
        <a href="https://shokujii.studio.site/restaurant" target="_blank" rel="noopener noreferrer" class="footer-text">
          飲食店パートナーになる
        </a>
        <a href="https://about.shokujii.jp/howto" target="_blank" rel="noopener noreferrer" class="footer-text">
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
        <a :href="LEGAL_URLS.terms" target="_blank" rel="noopener noreferrer" class="footer-text"> 利用規約 </a>
        <a :href="LEGAL_URLS.privacy" target="_blank" rel="noopener noreferrer" class="footer-text">
          プライバシーポリシー
        </a>
        <a :href="LEGAL_URLS.commercial" target="_blank" rel="noopener noreferrer" class="footer-text">
          特定商取引法に基づく表記
        </a>
        <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank" rel="noopener noreferrer" class="footer-text">
          お問い合わせ
        </a>
        <a href="https://nijuni.jp/" target="_blank" rel="noopener noreferrer" class="footer-text"> 運営会社 </a>
      </template>
    </div>
    <p class="site-footer__grant text-center">令和２年度補正ものづくり補助金により作成</p>
    <p class="site-footer__copyright text-center">
      &copy;
      {{ new Date().getFullYear() }}
      nijuni inc.
    </p>
  </footer>
</template>
<style scoped lang="scss">
.site-footer {
  margin-top: 60px;
  margin-bottom: 12px;
}

.site-footer--compact {
  margin-top: 24px;
  margin-bottom: 8px;
}

.site-footer__sns {
  margin-bottom: 20px;
}

.site-footer__sns-heading {
  margin: 20px 0;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.site-footer__sns-icons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px 20px;
}

.site-footer__sns-icon {
  width: 45px;
  height: 45px;
  border-radius: 20%;
  display: block;
}

.site-footer__links {
  margin: 20px 0;
}

.site-footer--compact .site-footer__links {
  margin: 8px 0 12px;
}

.site-footer--compact .site-footer__sns {
  margin-bottom: 12px;
}

.site-footer--compact .site-footer__sns-heading {
  margin: 12px 0;
}

.footer-text {
  font-size: 12px;
  margin: 4px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-decoration: none;

  &:hover {
    color: rgb(var(--v-global-theme-primary));
    text-decoration: underline;
  }
}

.site-footer--compact .footer-text {
  font-size: 11px;
  margin: 3px;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.site-footer__grant {
  font-size: 9px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin: 0 0 4px;
}

.site-footer__copyright {
  font-size: 16px;
  margin: 0 0 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.site-footer--compact .site-footer__copyright {
  font-size: 11px;
  margin-bottom: 8px;
  color: rgba(var(--v-theme-on-surface), 0.4);
}

@media (max-width: 599px) {
  .site-footer__sns-icon {
    width: 36px;
    height: 36px;
  }

  .site-footer__sns-heading {
    font-size: 0.75rem;
  }
}
</style>
