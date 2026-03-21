import sharp from 'sharp'

/**
 * Resize image to fit within the given size while maintaining aspect ratio.
 * @param imageBuffer The image buffer to resize.
 * @param size The maximum width or height of the resized image.
 * @returns The resized image buffer.
 *
 * @throws Error if the image buffer is not a valid image.
 */
export const resizeImage = async (imageBuffer: Buffer, size: number): Promise<Buffer> => {
  const image = sharp(imageBuffer)
  const metadata = await image.metadata()
  // image.metadata() throws error if the image buffer is not a valid image and defines width and height as number.
  // It means metadata.width and metadata.height are guaranteed to be defined as number and not null or undefined.
  const width = metadata.width
  const height = metadata.height
  const options: sharp.ResizeOptions = {
    withoutEnlargement: true,
  }
  if (width > height) {
    options.width = size
  } else {
    options.height = size
  }

  const thumbnailImage = image.resize(options)
  return await thumbnailImage.toBuffer()
}
