/**
 * Generate thumbnail from image file
 */
export async function generateThumbnail(
  file: File,
  maxWidth: number = 300,
  maxHeight: number = 200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate thumbnail dimensions while maintaining aspect ratio
      const aspectRatio = img.width / img.height
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }
      } else {
        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and resize image
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)

        // Convert canvas to blob and then to File
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const thumbnailFile = new File(
                [blob],
                `thumb_${file.name}`,
                {
                  type: file.type,
                  lastModified: Date.now()
                }
              )
              resolve(thumbnailFile)
            } else {
              reject(new Error('Failed to generate thumbnail blob'))
            }
          },
          file.type,
          quality
        )
      } else {
        reject(new Error('Failed to get canvas context'))
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Create object URL for the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generate multiple thumbnail sizes from image file
 */
export async function generateThumbnails(file: File): Promise<{
  small: File,     // 150x100 for cards
  medium: File,    // 300x200 for listings
  large: File      // 600x400 for detail view
}> {
  const [small, medium, large] = await Promise.all([
    generateThumbnail(file, 300, 200, 0.8),
    generateThumbnail(file, 600, 400, 0.85),
    generateThumbnail(file, 800, 600, 0.9)
  ])

  return { small, medium, large }
}

/**
 * Optimized batch thumbnail generation for multiple files
 */
export async function generateThumbnailsBatch(files: File[]): Promise<{
  [index: number]: {
    small: File,
    medium: File,
    large: File
  }
}> {
  // Process all files in parallel
  const results = await Promise.all(
    files.map(async (file, index) => ({
      index,
      thumbnails: await generateThumbnails(file)
    }))
  )

  // Convert to indexed object
  const thumbnailsMap: { [index: number]: { small: File; medium: File; large: File } } = {}
  for (const result of results) {
    thumbnailsMap[result.index] = result.thumbnails
  }

  return thumbnailsMap
}