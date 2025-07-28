'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

const propertySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  original_price: z.string().min(0, 'Original price must be positive'),
  price: z.string().min(0, 'Price must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  property_type: z.string().min(1, 'Property type is required'),
  transaction_type: z.string().min(1, 'Transaction type is required'),
  area: z.string().min(1, 'Area must be greater than 0'),
  full_area: z.string().min(1, 'Full area must be greater than 0'),
  rooms: z.string().min(0, 'Rooms must be 0 or greater'),
  baths: z.string().min(0, 'Baths must be 0 or greater'),
})

interface DefaultValues extends z.infer<typeof propertySchema> {
}

interface Property {
  id: string
  description: string
  original_price: string
  price: string
  currency: string
  property_type: string
  transaction_type: string
  area: string
  full_area: string
  rooms: string
  baths: number
  images: string[]
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
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DefaultValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      description: '',
      original_price: '',
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

        // Set form values
        Object.entries(data).forEach(([key, value]) => {
          if (key in propertySchema.shape) {
            setValue(key as keyof typeof propertySchema.shape, value as any)
          }
        })
      } catch (error: any) {
        console.error('Error fetching property:', error)
        toast.error(error.message || 'Failed to load property')
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [resolvedParams, setValue])

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      console.log('Updating property with ID:', resolvedParams.id)

      // Upload images to Supabase Storage and get paths
      const imagesData: string[] = []
      if (images.length > 0) {
        for (const image of images) {
          const fileExt = image.name.split('.').pop()
          const filePath = `${resolvedParams.id}/${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabase
            .storage
            .from('images')
            .upload(filePath, image)

          if (uploadError) throw uploadError
          imagesData.push(filePath)
        }
      }

      const updateData = { ...data, images: imagesData }
      console.log('Update data:', updateData)

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', resolvedParams.id)

      console.log('Update error:', error)
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Property</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload */}
              <div className="col-span-full">
                <Label>Property Images</Label>
                <FileUploader onSelectedFiles={setImages} mimeType={['image/jpeg', 'image/png', 'image/jpg' ]} />
                {property?.images && property.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {property.images.map((imagePath: string, index: number) => {
                      const { data } = supabase.storage.from('images').getPublicUrl(imagePath)
                      return (
                        <div key={index} className="relative">
                          <img
                            src={data.publicUrl}
                            alt={`Property ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
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
                <Label>Original Price</Label>
                <Input
                  type="number"
                  {...register('original_price')}
                  className={cn(
                    "mt-2",
                    errors.original_price && "border-red-500"
                  )}
                />
                {errors.original_price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.original_price.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Currency</Label>
                <Select
                  {...register('currency')}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger>
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
                  {...register('property_type')}
                  onValueChange={(value) => setValue('property_type', value)}
                >
                  <SelectTrigger>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Transaction Type</Label>
                <Select
                  {...register('transaction_type')}
                  onValueChange={(value) => setValue('transaction_type', value)}
                >
                  <SelectTrigger>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  "mt-2",
                  errors.description && "border-red-500"
                )}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
