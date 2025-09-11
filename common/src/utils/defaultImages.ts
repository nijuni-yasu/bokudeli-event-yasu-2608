// コミュニティのデフォルト画像セットの型定義
export interface CommunityDefaultImageSet {
  icon: string
  cover: string
}

// 画像のベースパス
const IMAGE_BASE_PATH = '/images/community_default/'

// 画像ファイル名の配列
const ICON_FILES = [
  'community_default_icon_01.png',
  'community_default_icon_02.png',
  'community_default_icon_03.png',
  'community_default_icon_04.png',
  'community_default_icon_05.png',
  'community_default_icon_06.png',
  'community_default_icon_07.png',
  'community_default_icon_08.png',
] as const

const COVER_FILES = [
  'community_default_cover_01.png',
  'community_default_cover_02.png',
  'community_default_cover_03.png',
  'community_default_cover_04.png',
  'community_default_cover_05.png',
  'community_default_cover_06.png',
  'community_default_cover_07.png',
  'community_default_cover_08.png',
] as const

// コミュニティのデフォルト画像セットの配列
export const COMMUNITY_DEFAULT_IMAGE_SETS: CommunityDefaultImageSet[] = [
  { icon: IMAGE_BASE_PATH + ICON_FILES[0], cover: IMAGE_BASE_PATH + COVER_FILES[0] },
  { icon: IMAGE_BASE_PATH + ICON_FILES[1], cover: IMAGE_BASE_PATH + COVER_FILES[1] },
  { icon: IMAGE_BASE_PATH + ICON_FILES[2], cover: IMAGE_BASE_PATH + COVER_FILES[2] },
  { icon: IMAGE_BASE_PATH + ICON_FILES[3], cover: IMAGE_BASE_PATH + COVER_FILES[3] },
  { icon: IMAGE_BASE_PATH + ICON_FILES[4], cover: IMAGE_BASE_PATH + COVER_FILES[4] },
  { icon: IMAGE_BASE_PATH + ICON_FILES[5], cover: IMAGE_BASE_PATH + COVER_FILES[5] },
  { icon: IMAGE_BASE_PATH + ICON_FILES[6], cover: IMAGE_BASE_PATH + COVER_FILES[6] },
  { icon: IMAGE_BASE_PATH + ICON_FILES[7], cover: IMAGE_BASE_PATH + COVER_FILES[7] },
] as const
