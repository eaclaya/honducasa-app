"use client"
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
import { Bath, Bed, Heart, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"

export interface Property {
  id: number
  title: string
  description: string | null
  price: number | null
  rooms: number | null
  baths: number | null
  location: string | {latitude: number, longitude: number} | null
  address?: string | null
  images: ImageInput[] | string[] | null
  favorites?: { property_id: number, user_id: string }[]
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

function normalizeImages(images: (ImageInput | string)[] | ImageInput | string | null): (ImageInput | string)[] {
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
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
  }, [supabase])

  // Check if this property is favorited by the current user
  useEffect(() => {
    if (user && property.favorites) {
      const userFavorite = property.favorites.find(fav => fav.user_id === user.id)
      setIsFavorite(!!userFavorite)
    } else {
      setIsFavorite(false)
    }
  }, [user, property.favorites])

  const handlePropertyClick = () => {
    // Store current search params in localStorage before navigating
    if (searchParams.toString()) {
      localStorage.setItem('searchParams', searchParams.toString())
    }
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking heart
    e.stopPropagation()

    if (!user) {
      router.push('/login')
      return
    }

    if (!property.id) return

    setIsLoadingFavorite(true)

    try {
      if (isFavorite) {
      // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('property_id', property.id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsFavorite(false)
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            property_id: property.id,
            user_id: user.id,
          })

        if (error) throw error
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // Revert optimistic update on error
      setIsFavorite(!isFavorite)
  } finally {
      setIsLoadingFavorite(false)
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
                <Link href={url} onClick={handlePropertyClick}>
                  <img
                    src={getImageUrl(image)}
                    alt={`${property.description} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </Link>
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
      <div className="flex-1 px-2 py-2">
        <Link href={url} onClick={handlePropertyClick}>
          <h3 className="text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {property.title}
          </h3>

        <div className="flex flex-col gap-4">
          <span className="text-gray-600 font-bold text-xl">${property.price?.toLocaleString() || 'Price not available'}</span>
          <p className="line-clamp-2">{property.description || 'No description available'}</p>
          <div className="flex items-center gap-2">
          {property.rooms && property.rooms > 0 && (
            <div className="flex flex-col gap-1">
              <Bed className="w-4 h-4" /><span className="text-gray-600"> {property.rooms} rooms</span>
            </div>
          )}
          {property.baths && property.baths > 0 && (
            <div className="flex flex-col gap-1">
              <Bath className="w-4 h-4" /><span className="text-gray-600"> {property.baths} baths</span>
            </div>
          )}
          </div>
        </div>
        </Link>
        <div className="flex items-center justify-between gap-2 text-gray-600 mt-2">
          <div className="flex-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="line-clamp-2 text-sm">{getLocationDisplay(property)}</p>
          </div>
          <button
            type="button"
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer`}
            onClick={toggleFavorite}
            disabled={isLoadingFavorite}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite
                 ? 'text-red-500 fill-red-500'
                  : 'text-gray-400'
              }`}
            />
          </button>
        </div>

      </div>
    </div>
  )
}
