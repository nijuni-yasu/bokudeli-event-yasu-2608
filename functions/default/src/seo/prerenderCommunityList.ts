import { escapeHtmlAttribute, escapeHtmlText } from './escape.js'

export interface CommunityListPreviewEntry {
  communityAccount: string
  communityName: string
}

export const COMMUNITY_LIST_PAGE_TITLE = 'コミュニティ一覧'

export const COMMUNITY_LIST_META_DESCRIPTION =
  '食事会・ランチ会のコミュニティ一覧。参加したいコミュニティを探したり、幹事向けの食事イベント情報をチェックできます。'

export const buildCommunityListPrerenderHtml = (site: string, communities: CommunityListPreviewEntry[]): string => {
  const listItems = communities
    .map((community) => {
      const href = `${site}/c/${community.communityAccount.toLowerCase()}`
      return `  <li><a href="${escapeHtmlAttribute(href)}">${escapeHtmlText(community.communityName)}</a></li>`
    })
    .join('\n')

  const listBlock = listItems !== '' ? `<ul>\n${listItems}\n</ul>` : ''

  return `<article>
  <nav>
  <a href="${escapeHtmlAttribute(`${site}/`)}">${escapeHtmlText('トップ')}</a>
</nav>
  <h1>${escapeHtmlText(COMMUNITY_LIST_PAGE_TITLE)}</h1>
  ${listBlock}
</article>`
}
