// If the default image is not found, use the first image as fallback
import defaultCoverImage1 from '../assets/images/community_default/community_default_cover_01.png'
import defaultIconImage1 from '../assets/images/community_default/community_default_icon_01.png'

const communityDefaultImages = import.meta.glob<{ default: string }>('../assets/images/community_default/*.png', {
  eager: true,
})

// communityDefaultImages contains both cover and icon images, so divide by 2
const COMMUNITY_DEFAULT_IMAGE_SIZE = Object.keys(communityDefaultImages).length / 2

async function getDefaultFile(index: number, type: 'cover' | 'icon'): Promise<File> {
  const id = (index + 1).toString().padStart(2, '0')
  const fileName = `community_default_${type}_${id}.png`
  const path = `../assets/images/community_default/${fileName}`
  let url = communityDefaultImages[path]?.default
  if (url == null) {
    if (type === 'cover') {
      url = defaultCoverImage1
    } else {
      url = defaultIconImage1
    }
  }
  const res = await fetch(url)
  const blob = await res.blob()
  return new File([blob], fileName, {
    type: blob.type,
  })
}

export async function getCommunityDefaultImages(): Promise<{ coverFile: File; iconFile: File }> {
  const randomIndex = Math.floor(Math.random() * COMMUNITY_DEFAULT_IMAGE_SIZE)
  const coverFile = await getDefaultFile(randomIndex, 'cover')
  const iconFile = await getDefaultFile(randomIndex, 'icon')
  return { coverFile, iconFile }
}
