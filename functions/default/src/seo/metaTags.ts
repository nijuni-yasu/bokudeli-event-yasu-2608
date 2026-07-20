import { escapeHtmlAttribute } from './escape.js'

export const SITE_NAME_SUFFIX = 'shokujii'
export const OGP_SITE_NAME = '食事でつながる「shokujii」'
export const DEFAULT_OGP_IMAGE_TYPE = 'image/png'

export interface OgpMetaContext {
  site: string
  url: string
  image: string
  imageType: string
  title: string
  description: string
}

export const buildDocumentTitle = (pageName: string): string => `${pageName} | ${SITE_NAME_SUFFIX}`

export const buildMetaDescriptionTag = (description: string): string =>
  `<meta name="description" content="${escapeHtmlAttribute(description)}">`

export const buildCanonicalLinkTag = (canonicalUrl: string): string =>
  `<link rel="canonical" href="${escapeHtmlAttribute(canonicalUrl)}">`

export const buildOgpMetaTags = (context: OgpMetaContext): string => {
  const title = escapeHtmlAttribute(context.title)
  const description = escapeHtmlAttribute(context.description)
  const image = escapeHtmlAttribute(context.image)
  const url = escapeHtmlAttribute(context.url)
  const imageType = escapeHtmlAttribute(context.imageType || DEFAULT_OGP_IMAGE_TYPE)

  return `<meta property="og:title" content="${title}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="${imageType}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${escapeHtmlAttribute(OGP_SITE_NAME)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:description" content="${description}">`
}

export const buildSeoHeadBlock = (params: {
  metaDescription: string
  canonicalUrl: string
  jsonLd: Record<string, unknown>
}): string => {
  const safeJsonLd = JSON.stringify(params.jsonLd).replace(/<\//g, '<\\/')
  const jsonLdScript = `<script type="application/ld+json">${safeJsonLd}</script>`
  return `${buildMetaDescriptionTag(params.metaDescription)}
${buildCanonicalLinkTag(params.canonicalUrl)}
${jsonLdScript}`
}
