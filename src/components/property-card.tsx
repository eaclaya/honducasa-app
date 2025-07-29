"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { getMainImageUrl, type ImageInput } from "@/utils/image-helpers"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Bath, Bed, MapPin } from "lucide-react"

export interface Property {
  id: number
  title: string
  description: string
  price: number
  rooms: number
  baths: number
  location: string | {latitude: number, longitude: number} | null
  address?: string | null
  images: ImageInput[]
}

function getImageUrl(imageData: ImageInput | string): string {
  if (!imageData) return '/images/placeholder-property.jpg'

  // If it's already a full URL, return as is
  if (typeof imageData === 'string' && imageData.startsWith('http')) {
    return imageData
  }

  // Use thumbnail URL for property cards
  return getMainImageUrl(imageData as ImageInput)
}

function normalizeImages(images: (ImageInput | string)[] | ImageInput | string): (ImageInput | string)[] {
  if (!images) return ['/images/placeholder-property.jpg']

  // If it's already an array, return as is
  if (Array.isArray(images)) {
    return images.length > 0 ? images : ['/images/placeholder-property.jpg']
  }

  // If it's a single image, wrap in an array
  return [images]
}

function getLocationDisplay(property: Property): string {
  // First try to use the address field if available
  if (property.address) {
    return property.address
  }
  
  // If location is a string, use it
  if (typeof property.location === 'string') {
    return property.location
  }
  
  // If location is coordinates, show coordinates as fallback
  if (property.location && typeof property.location === 'object' && 'latitude' in property.location) {
    return `${property.location.latitude.toFixed(6)}, ${property.location.longitude.toFixed(6)}`
  }
  
  // Fallback if no location data
  return 'Location not specified'
}

export function PropertyCard({ property, url, view }: { property: Property, url: string, view?: 'card' | 'list' }) {
  const imagesList = normalizeImages(property.images)
  const searchParams = useSearchParams()

  const handlePropertyClick = () => {
    // Store current search params in localStorage before navigating
    if (searchParams.toString()) {
      localStorage.setItem('searchParams', searchParams.toString())
    }
  }

  return (
    <div className={view === 'list' ? "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col md:flex-row" : "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col"}>
      <div className={`relative h-64 ${view === 'list' ? 'flex-1 max-w-[400px]' : 'w-full'}`}>
        <Carousel className="w-full h-full">
          <CarouselContent>
            {imagesList.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative h-64">
                  <img
                    src={getImageUrl(image)}
                    alt={`${property.description} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {imagesList.length > 1 && (
            <>
              <CarouselPrevious className="left-2 bg-white/80 hover:bg-white border-0 text-gray-800 hover:text-gray-900" />
              <CarouselNext className="right-2 bg-white/80 hover:bg-white border-0 text-gray-800 hover:text-gray-900" />
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {imagesList.map((_, index) => (
                  <div key={index} className="w-2 h-2 bg-white/60 rounded-full"></div>
                ))}
              </div>
            </>
          )}
        </Carousel>
      </div>
      <div className="p-4 flex-1">
        <Link href={url} onClick={handlePropertyClick}>
          <h3 className="text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {property.title}
          </h3>

        <div className="flex flex-col gap-4 mb-2">
          <span className="text-gray-600 font-bold text-xl">${property.price.toLocaleString()}</span>
          <p className="line-clamp-2">{property.description}</p>
          <div className="flex items-center gap-2">
          {property.rooms > 0 && (
            <div className="flex flex-col gap-1">
              <Bed className="w-4 h-4" /><span className="text-gray-600"> {property.rooms} rooms</span>
            </div>
          )}
          {property.baths > 0 && (
            <div className="flex flex-col gap-1">
              <Bath className="w-4 h-4" /><span className="text-gray-600"> {property.baths} baths</span>
            </div>
          )}
          </div>
        </div>
        <div className="flex items-start gap-2 text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="line-clamp-2 text-sm">{getLocationDisplay(property)}</p>
        </div>
        </Link>
      </div>
    </div>
  )
}
