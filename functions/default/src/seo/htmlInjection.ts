import { buildDocumentTitle, buildOgpMetaTags, buildSeoHeadBlock, type OgpMetaContext } from './metaTags.js'
import { escapeHtmlText } from './escape.js'

export const SEO_HEAD_BEGIN = '<!-- SEO_HEAD_BEGIN -->'
export const SEO_HEAD_END = '<!-- SEO_HEAD_END -->'
export const SEO_BODY_BEGIN = '<!-- SEO_BODY_BEGIN -->'
export const SEO_BODY_END = '<!-- SEO_BODY_END -->'
export const OGP_BEGIN_TAG = '<!-- OGP_BEGIN_TAG -->'
export const OGP_END_TAG = '<!-- OGP_END_TAG -->'

export interface SeoPageContext {
  pageTitle: string
  metaDescription: string
  canonicalUrl: string
  jsonLd: Record<string, unknown>
  prerenderHtml: string
  ogp: OgpMetaContext
}

const replaceSection = (html: string, beginMarker: string, endMarker: string, replacement: string): string => {
  const beginIndex = html.indexOf(beginMarker)
  if (beginIndex === -1) {
    return html
  }
  const afterBegin = beginIndex + beginMarker.length
  const endIndex = html.indexOf(endMarker, afterBegin)
  if (endIndex === -1) {
    return html
  }
  return html.slice(0, afterBegin) + replacement + html.slice(endIndex)
}

const replaceTitle = (html: string, title: string): string => {
  const escaped = escapeHtmlText(title)
  return html.replace(/<title>[^<]*<\/title>/, () => `<title>${escaped}</title>`)
}

/** Function 注入ページ向け: index.html の静的 meta description を除去（重複防止） */
export const stripStaticMetaDescription = (html: string): string =>
  html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>\s*/i, '')

/**
 * Function 注入ページ向け: index.html の静的 canonical（トップ固定）を除去。
 * 残すとページ固有 canonical と 2 本になり、矛盾する canonical は無視される。
 */
export const stripStaticCanonicalLink = (html: string): string => html.replace(/<link\s+rel="canonical"[^>]*>\s*/i, '')

export const injectSeoHtml = (html: string, context: SeoPageContext): string => {
  const documentTitle = buildDocumentTitle(context.pageTitle)
  const seoHeadBlock = buildSeoHeadBlock({
    metaDescription: context.metaDescription,
    canonicalUrl: context.canonicalUrl,
    jsonLd: context.jsonLd,
  })
  const ogpBlock = buildOgpMetaTags(context.ogp)

  let result = stripStaticMetaDescription(html)
  result = stripStaticCanonicalLink(result)
  result = replaceTitle(result, documentTitle)
  result = replaceSection(result, SEO_HEAD_BEGIN, SEO_HEAD_END, `\n${seoHeadBlock}\n`)
  result = replaceSection(result, OGP_BEGIN_TAG, OGP_END_TAG, ogpBlock)
  result = replaceSection(result, SEO_BODY_BEGIN, SEO_BODY_END, `\n${context.prerenderHtml}\n`)
  return result
}
