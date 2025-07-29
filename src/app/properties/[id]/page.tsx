"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { getOriginalImageUrl, type ImageInput } from '@/utils/image-helpers'
import { ImageGalleryModal } from '@/components/image-gallery-modal'
import Link from 'next/link'
import { Map, MapPin, Pin } from 'lucide-react'

interface Property {
  id: number
  title: string | null
  description: string | null
  price: number | null
  currency: string | null
  property_type: string | null
  transaction_type: string | null
  area: number | null
  full_area: number | null
  rooms: number | null
  baths: number | null
  address: string | null
  location: unknown
  images: ImageInput[] | string[] | null
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProperty()
    }
  }, [params.id])

  async function fetchProperty() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setProperty(data)
    } catch (error) {
      console.error('Error fetching property:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSearch = () => {
    // Get stored search params from localStorage or current URL params
    const storedParams = localStorage.getItem('searchParams')
    let searchUrl = '/search'

    if (storedParams) {
      searchUrl = `/search?${storedParams}`
    } else if (searchParams.toString()) {
      // If no stored params but current URL has params, use those
      searchUrl = `/search?${searchParams.toString()}`
    }

    router.push(searchUrl)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property not found</h1>
          <Button onClick={handleBackToSearch}>Back to Search</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="outline" onClick={handleBackToSearch}>
          ← Back to Search
        </Button>
      </div>

      {property.images && property.images.length > 0 && (
        <div className="mb-8">
          <div
            className="relative cursor-pointer group"
            onClick={() => setIsGalleryOpen(true)}
          >
            <img
              src={getOriginalImageUrl(property.images[0] as ImageInput)}
              alt={property.title || 'Property image'}
              className="w-full h-[500px] object-cover rounded-lg transition-transform group-hover:scale-[1.02]"
            />
            {/* Overlay with image count */}
            {property.images.length > 1 && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  +{property.images.length - 1} more photos
                </div>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                Click to view all images
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {property.images && (
        <ImageGalleryModal
          images={property.images as (ImageInput | string)[]}
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          initialIndex={0}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-semibold mb-4">
            {property.title}
          </h1>
          <div className='flex items-center gap-2 mb-4'>
            <MapPin className="w-4 h-4" /> <span>{property.address}</span>
          </div>

          <div className="mb-6">
            <p className="text-2xl font-bold text-green-600">
              {property.currency || '$'}{property.price?.toLocaleString()}
            </p>
            {property.transaction_type && (
              <p className="text-gray-600 capitalize">
                For {property.transaction_type}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {property.rooms && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{property.rooms}</p>
                <p className="text-gray-600">Bedrooms</p>
              </div>
            )}
            {property.baths && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{property.baths}</p>
                <p className="text-gray-600">Bathrooms</p>
              </div>
            )}
            {property.area && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{property.area}</p>
                <p className="text-gray-600">Area (m²)</p>
              </div>
            )}
            {property.property_type && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-bold capitalize">{property.property_type}</p>
                <p className="text-gray-600">Type</p>
              </div>
            )}
          </div>


          <p>{property.description}</p>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <Link href={`/properties/${property.id}/edit`} className="block">
                <Button className="w-full">Edit Property</Button>
              </Link>
              <Button variant="outline" className="w-full">
                Contact Owner
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}