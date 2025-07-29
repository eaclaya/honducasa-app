import { supabase } from '@/lib/supabase'

export interface ImageData {
  original: string
  small: string
  medium: string
  large: string
}

export type ImageInput = ImageData | string

/**
 * Get the appropriate image URL for different contexts
 */
export function getImageUrl(imageData: ImageInput, size: 'small' | 'medium' | 'large' | 'original' = 'medium'): string {
  // Handle old format (string path)
  if (typeof imageData === 'string') {
    const { data } = supabase.storage.from('images').getPublicUrl(imageData)
    return data.publicUrl
  }

  // Handle new format (ImageData object)
  const path = imageData[size] || imageData.original
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Convert old format images to new format for backwards compatibility
 */
export function normalizeImageData(images: (ImageData | string)[]): ImageData[] {
  return images.map(img => {
    if (typeof img === 'string') {
      // Convert old format to new format
      return {
        original: img,
        small: img,
        medium: img,
        large: img
      }
    }
    return img
  })
}

/**
 * Get thumbnail URL (small size) for property cards
 */
export function getThumbnailUrl(imageData: ImageInput): string {
  return getImageUrl(imageData, 'small')
}

/**
 * Get main image URL (medium size) for property listings
 */
export function getMainImageUrl(imageData: ImageInput): string {
  return getImageUrl(imageData, 'medium')
}

/**
 * Get large image URL for property detail view
 */
export function getLargeImageUrl(imageData: ImageInput): string {
  return getImageUrl(imageData, 'large')
}

/**
 * Get large image URL for property detail view
 */
export function getOriginalImageUrl(imageData: ImageInput): string {
  return getImageUrl(imageData, 'original')
}