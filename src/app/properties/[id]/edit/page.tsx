'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import FileUploader from '@/components/shared/file-uploader'
import MapboxLocationPicker from '@/components/shared/mapbox-location-picker'
import { uploadImagesWithFallback, type UploadProgress, type ImageData } from '@/utils/image-upload'
import LoadingSpinner from '@/components/shared/loadig-spinner'
import { X, GripVertical, Star, Upload } from 'lucide-react'

const propertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Price must be a positive number'),
  currency: z.string().min(1, 'Currency is required'),
  property_type: z.string().min(1, 'Property type is required'),
  transaction_type: z.string().min(1, 'Transaction type is required'),
  area: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Area must be greater than 0'),
  full_area: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Full area must be greater than 0'),
  rooms: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Rooms must be 0 or greater'),
  baths: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Baths must be 0 or greater'),
})

type DefaultValues = z.infer<typeof propertySchema>

interface Property {
  id: string
  title: string
  description: string
  original_price: number | null
  price: string
  currency: string
  property_type: string
  transaction_type: string
  area: string
  full_area: string
  rooms: string
  baths: number
  location: {latitude: number, longitude: number} | null
  address: string | null
  images: (ImageData | string)[] // Support both old and new format
}

const propertyTypes = [
  'Apartment',
  'House',
  'Land',
]

const transactionTypes = [
  'For Sale',
  'For Rent',
]

const currencies = [
  'HNL',
  'USD',
]


interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditPropertyPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<File[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const [originalPrice, setOriginalPrice] = useState<number | null>(null)
  const [imageError, setImageError] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DefaultValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      currency: 'HNL',
      property_type: 'Apartment',
      transaction_type: 'For Sale',
      area: '',
      full_area: '',
      rooms: '',
      baths: ''
    }
  })

  const watchedCurrency = watch('currency')
  const watchedPropertyType = watch('property_type')
  const watchedTransactionType = watch('transaction_type')

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', parseInt(resolvedParams.id))
          .single()

        if (error) throw error
        if (!data) throw new Error('Property not found')

        setProperty(data)

        // Store original price for tracking changes
        setOriginalPrice(data.original_price)

        // Set location if available
        if (data.location) {
          setLocation(data.location)
        }

        // Set form values
        Object.entries(data).forEach(([key, value]) => {
          if (key in propertySchema.shape) {
            // Convert numbers to strings for form fields
            const stringValue = value !== null && value !== undefined ? String(value) : ''
            setValue(key as keyof DefaultValues, stringValue)
          }
        })
      } catch (error) {
        console.error('Error fetching property:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to load property')
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [resolvedParams, setValue])

  const onSubmit = async (data: DefaultValues) => {
    try {
      setLoading(true)

      // Check if there are existing images or new images uploaded
      const existingImages = property?.images || []
      const hasExistingImages = existingImages.length > 0
      const hasNewImages = images.length > 0

      if (!hasExistingImages && !hasNewImages) {
        setImageError('At least one image is required')
        toast.error('At least one image is required')
        setLoading(false)
        return
      }

      // Clear any previous image error
      setImageError('')

      // Upload new images with optimized parallel processing
      let newImagesData: ImageData[] = []
      if (hasNewImages) {
        setIsUploading(true)

        const uploadResult = await uploadImagesWithFallback(
          images,
          resolvedParams.id,
          (progress) => {
            setUploadProgress(progress)
          }
        )

        if (!uploadResult.success) {
          // Show errors but continue if some uploads succeeded
          if (uploadResult.errors.length > 0) {
            const errorMessage = `Failed to upload ${uploadResult.errors.length} image(s): ${uploadResult.errors.map(e => e.error).join(', ')}`
            toast.error(errorMessage)
          }
        }

        newImagesData = uploadResult.images
        setIsUploading(false)
        setUploadProgress([])

        if (newImagesData.length === 0) {
          throw new Error('No images were uploaded successfully')
        }
      }

      // Combine existing images with new images
      const allImages = [...existingImages, ...newImagesData]

      // Convert string fields back to numbers for database
      const newPrice = Number(data.price)

      // Set original_price only if the price has changed and original_price is not set
      let finalOriginalPrice = originalPrice
      if (originalPrice === null || originalPrice === undefined) {
        finalOriginalPrice = newPrice
      }

      const updateData = {
        ...data,
        images: allImages,
        location: location,
        original_price: finalOriginalPrice,
        price: newPrice,
        area: Number(data.area),
        full_area: Number(data.full_area),
        rooms: Number(data.rooms),
        baths: Number(data.baths)
      }

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', resolvedParams.id)

      if (error) throw error

      toast.success('Property updated successfully')
      router.push('/properties')
    } catch (error) {
      console.error('Error updating property:', error)
      toast.error('Failed to update property')
    } finally {
      setLoading(false)
    }
  }

  function removeImage(index: number) {
    if (property?.images) {
      const newImages = [...property.images]
      newImages.splice(index, 1)
      setProperty({
        ...property,
        images: newImages
      })
    }
  }

  function moveImageToFirst(index: number) {
    if (property?.images && index > 0) {
      const newImages = [...property.images]
      const [imageToMove] = newImages.splice(index, 1)
      newImages.unshift(imageToMove)
      setProperty({
        ...property,
        images: newImages
      })
      toast.success('Main image updated')
    }
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (property?.images) {
      const newImages = [...property.images]
      const [movedImage] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, movedImage)
      setProperty({
        ...property,
        images: newImages
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className='flex justify-between'>
          <CardTitle>Edit Property</CardTitle>
          <Button type="submit" disabled={loading || isUploading} onClick={handleSubmit(onSubmit)}>
              {(loading || isUploading) ? <LoadingSpinner />  : ''}
              {isUploading ? 'Uploading...' : 'Save Property'}
            </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className='flex flex-col'>
            <div className="w-full">
                <Label>Title</Label>
                <Input
                  type="text"
                  {...register('title')}
                  className={cn(
                    "mt-2 w-full",
                    errors.title && "border-red-500"
                  )}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  {...register('price')}
                  className={cn(
                    "mt-2",
                    errors.price && "border-red-500"
                  )}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={watchedCurrency}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger  className="w-full mt-2">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.currency.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Property Type</Label>
                <Select
                  value={watchedPropertyType}
                  onValueChange={(value) => setValue('property_type', value)}
                >
                  <SelectTrigger  className="w-full mt-2">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((propertyType) => (
                      <SelectItem key={propertyType} value={propertyType}>
                        {propertyType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.property_type && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.property_type.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Transaction Type</Label>
                <Select
                  value={watchedTransactionType}
                  onValueChange={(value) => setValue('transaction_type', value)}
                >
                  <SelectTrigger  className="w-full mt-2">
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((transactionType) => (
                      <SelectItem key={transactionType} value={transactionType}>
                        {transactionType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.transaction_type && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.transaction_type.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Area</Label>
                <Input
                  type="number"
                  {...register('area')}
                  className={cn(
                    "mt-2",
                    errors.area && "border-red-500"
                  )}
                />
                {errors.area && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.area.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Full Area</Label>
                <Input
                  type="number"
                  {...register('full_area')}
                  className={cn(
                    "mt-2",
                    errors.full_area && "border-red-500"
                  )}
                />
                {errors.full_area && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.full_area.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Rooms</Label>
                <Input
                  type="number"
                  {...register('rooms')}
                  className={cn(
                    "mt-2",
                    errors.rooms && "border-red-500"
                  )}
                />
                {errors.rooms && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.rooms.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Baths</Label>
                <Input
                  type="number"
                  {...register('baths')}
                  className={cn(
                    "mt-2",
                    errors.baths && "border-red-500"
                  )}
                />
                {errors.baths && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.baths.message}
                  </p>
                )}
              </div>

            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                {...register('description')}
                className={cn(
                  "mt-2 h-96",
                  errors.description && "border-red-500"
                )}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Location Map */}
            <div>
              <Label>Property Location</Label>
              <div className="mt-2">
                <MapboxLocationPicker
                  onLocationSelect={(locationData) => {
                    setLocation({
                      latitude: locationData.latitude,
                      longitude: locationData.longitude
                    })
                  }}
                  initialLocation={location ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: property?.address || undefined
                  } : undefined}
                  height="400px"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Click on the map to set the exact property location
              </p>
            </div>
              {/* File Upload */}
              <div className="col-span-full">
                <Label>Property Images <span className="text-red-500">*</span></Label>
                <div className="mt-2">
                  <FileUploader onSelectedFiles={setImages} mimeType={['image/jpeg', 'image/png', 'image/jpg', 'image/webp'] } />
                </div>
                {imageError ? (
                  <p className="text-sm text-red-500 mt-2 font-medium">{imageError}</p>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">At least one image is required</p>
                )}

                {/* Upload Progress */}
                {isUploading && uploadProgress.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">Uploading images...</span>
                    </div>
                    {uploadProgress.map((progress) => (
                      <div key={progress.imageIndex} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="truncate max-w-[200px]">{progress.fileName}</span>
                          <span className={`font-medium ${
                            progress.status === 'error' ? 'text-red-600' :
                            progress.status === 'completed' ? 'text-green-600' :
                            'text-blue-600'
                          }`}>
                            {progress.status === 'generating' && 'Generating thumbnails...'}
                            {progress.status === 'uploading' && `${progress.progress}%`}
                            {progress.status === 'completed' && 'Completed'}
                            {progress.status === 'error' && 'Failed'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              progress.status === 'error' ? 'bg-red-500' :
                              progress.status === 'completed' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                        {progress.error && (
                          <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {property?.images && property.images.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <Star className="w-4 h-4 inline mr-1" />
                        The first image will be used as the main image. Drag to reorder or click the star to set as main.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {property.images.map((imageData: ImageData | string, index: number) => {
                        // Handle both old format (string) and new format (ImageData)
                        const imagePath = typeof imageData === 'string'
                          ? imageData
                          : imageData.large || imageData.original

                        const { data } = supabase.storage.from('images').getPublicUrl(imagePath)
                        const isMainImage = index === 0

                        return (
                          <div
                            key={index}
                            className={`relative group bg-white rounded-lg shadow-md overflow-hidden ${
                              isMainImage ? 'ring-2 ring-blue-500' : ''
                            }`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', index.toString())
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                              if (fromIndex !== index) {
                                moveImage(fromIndex, index)
                              }
                            }}
                          >
                            {/* Main image badge */}
                            {isMainImage && (
                              <div className="absolute top-2 left-2 z-20 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                Main Image
                              </div>
                            )}

                            {/* Control buttons */}
                            <div className="absolute top-2 right-2 z-20 flex gap-1">
                              {!isMainImage && (
                                <button
                                  type="button"
                                  onClick={() => moveImageToFirst(index)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                  title="Set as main image"
                                >
                                  <Star className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Drag handle */}
                            <div className="absolute top-1/2 left-2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                              <div className="bg-black/50 text-white p-1 rounded">
                                <GripVertical className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Image */}
                            <img
                              src={data.publicUrl}
                              alt={`Property ${index + 1}${isMainImage ? ' (Main)' : ''}`}
                              className="w-full h-48 object-cover"
                            />

                            {/* Image info */}
                            <div className="p-3">
                              <p className="text-sm text-gray-600">
                                Image {index + 1} {isMainImage ? '(Main)' : ''}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
