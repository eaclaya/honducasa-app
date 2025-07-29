import { createClient } from '@/utils/supabase/client'
import { generateThumbnailsBatch } from './thumbnail'

export interface ImageData {
  original: string
  small: string
  medium: string
  large: string
}

export interface UploadProgress {
  imageIndex: number
  fileName: string
  progress: number // 0-100
  status: 'generating' | 'uploading' | 'completed' | 'error'
  error?: string
}

export interface UploadResult {
  success: boolean
  images: ImageData[]
  errors: Array<{ index: number; error: string }>
}

/**
 * Optimized parallel image upload with progress tracking
 */
export async function uploadImagesOptimized(
  files: File[],
  propertyId: string,
  onProgress?: (progress: UploadProgress[]) => void
): Promise<UploadResult> {
  const supabase = createClient()
  const results: ImageData[] = []
  const errors: Array<{ index: number; error: string }> = []
  
  // Initialize progress tracking
  const progressMap: { [index: number]: UploadProgress } = {}
  for (let i = 0; i < files.length; i++) {
    progressMap[i] = {
      imageIndex: i,
      fileName: files[i].name,
      progress: 0,
      status: 'generating'
    }
  }
  
  const updateProgress = () => {
    if (onProgress) {
      onProgress(Object.values(progressMap))
    }
  }

  try {
    // Step 1: Generate all thumbnails in parallel
    updateProgress()
    const thumbnailsMap = await generateThumbnailsBatch(files)
    
    // Step 2: Upload all images and thumbnails in parallel
    const uploadPromises = files.map(async (file, index) => {
      try {
        progressMap[index].status = 'uploading'
        progressMap[index].progress = 25
        updateProgress()

        const timestamp = Date.now() + index // Ensure unique timestamps
        const fileExt = file.name.split('.').pop()
        const baseFileName = `${propertyId}/${timestamp}`
        
        const thumbnails = thumbnailsMap[index]
        
        // Upload all 4 files in parallel for this image
        const [originalResult, smallResult, mediumResult, largeResult] = await Promise.all([
          supabase.storage.from('images').upload(`${baseFileName}.${fileExt}`, file),
          supabase.storage.from('images').upload(`${baseFileName}_small.${fileExt}`, thumbnails.small),
          supabase.storage.from('images').upload(`${baseFileName}_medium.${fileExt}`, thumbnails.medium),
          supabase.storage.from('images').upload(`${baseFileName}_large.${fileExt}`, thumbnails.large)
        ])

        // Check for upload errors
        if (originalResult.error) throw originalResult.error
        if (smallResult.error) throw smallResult.error
        if (mediumResult.error) throw mediumResult.error
        if (largeResult.error) throw largeResult.error

        progressMap[index].progress = 100
        progressMap[index].status = 'completed'
        updateProgress()

        return {
          index,
          data: {
            original: `${baseFileName}.${fileExt}`,
            small: `${baseFileName}_small.${fileExt}`,
            medium: `${baseFileName}_medium.${fileExt}`,
            large: `${baseFileName}_large.${fileExt}`
          }
        }
      } catch (error) {
        progressMap[index].status = 'error'
        progressMap[index].error = error instanceof Error ? error.message : 'Upload failed'
        progressMap[index].progress = 0
        updateProgress()
        
        return {
          index,
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }
    })

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises)
    
    // Process results
    for (const result of uploadResults) {
      if ('data' in result) {
        results[result.index] = result.data
      } else {
        errors.push({ index: result.index, error: result.error })
      }
    }

    return {
      success: errors.length === 0,
      images: results.filter(Boolean), // Remove any undefined entries
      errors
    }

  } catch (error) {
    // Update all progress to error state
    for (const key in progressMap) {
      progressMap[key].status = 'error'
      progressMap[key].error = error instanceof Error ? error.message : 'Batch upload failed'
    }
    updateProgress()

    return {
      success: false,
      images: [],
      errors: [{ index: -1, error: error instanceof Error ? error.message : 'Batch upload failed' }]
    }
  }
}

/**
 * Upload images with fallback to original-only format
 */
export async function uploadImagesWithFallback(
  files: File[],
  propertyId: string,
  onProgress?: (progress: UploadProgress[]) => void
): Promise<UploadResult> {
  try {
    // Try optimized upload first
    return await uploadImagesOptimized(files, propertyId, onProgress)
  } catch (error) {
    console.warn('Optimized upload failed, falling back to simple upload:', error)
    
    // Fallback: upload only original images
    const supabase = createClient()
    const results: ImageData[] = []
    const errors: Array<{ index: number; error: string }> = []

    const uploadPromises = files.map(async (file, index) => {
      try {
        const timestamp = Date.now() + index
        const fileExt = file.name.split('.').pop()
        const originalPath = `${propertyId}/${timestamp}.${fileExt}`
        
        const { error } = await supabase.storage.from('images').upload(originalPath, file)
        if (error) throw error

        return {
          index,
          data: {
            original: originalPath,
            small: originalPath,
            medium: originalPath,
            large: originalPath
          }
        }
      } catch (error) {
        return {
          index,
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }
    })

    const uploadResults = await Promise.all(uploadPromises)
    
    for (const result of uploadResults) {
      if ('data' in result) {
        results[result.index] = result.data
      } else {
        errors.push({ index: result.index, error: result.error })
      }
    }

    return {
      success: errors.length === 0,
      images: results.filter(Boolean),
      errors
    }
  }
}