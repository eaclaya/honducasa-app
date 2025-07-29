"use client"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import GoogleSearch from "@/components/shared/google-search"
import { PropertyCard, type Property } from "@/components/property-card"
import { createClient } from '@/utils/supabase/client'
import { type ImageInput } from '@/utils/image-helpers'

interface DatabaseProperty {
  id: number
  description: string | null
  price: number | null
  rooms: number | null
  baths: number | null
  address: string | null
  images: ImageInput[] | string[] | null
}

export default function Home() {
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [transactionType, setTransactionType] = useState('For Rent')
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchFeaturedProperties()
  }, [])

  // Auto-search when address is selected from GoogleSearch
  useEffect(() => {
    if (address) {
      handleSearch()
    }
  }, [address])

  async function fetchFeaturedProperties() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Transform database properties to PropertyCard format
      const transformedProperties: Property[] = (data || []).map((prop: DatabaseProperty) => ({
        id: prop.id,
        title: prop.description || 'Untitled Property',
        description: prop.description || 'No description available',
        price: prop.price || 0,
        rooms: prop.rooms || 0,
        baths: prop.baths || 0,
        location: prop.address || 'Location not specified',
        images: (prop.images as ImageInput[]) || []
      }))

      setFeaturedProperties(transformedProperties)
    } catch (error) {
      console.error('Error fetching featured properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const searchParams = new URLSearchParams()

    if (address) {
      searchParams.set('address', address)
    }

    if (transactionType) {
      searchParams.set('transaction_type', transactionType)
    }

    const queryString = searchParams.toString()
    router.push(`/search${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative h-[600px] bg-cover bg-center" style={{ backgroundImage: 'url("https://png.pngtree.com/background/20250505/original/pngtree-minimalist-modern-house-with-a-white-facade-black-accents-and-landscaped-picture-image_16261487.jpg")' }}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Find Your Dream Home
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Search thousands of properties for rent or sale
          </p>

          {/* Search Panel */}
          <div className="bg-white backdrop-blur-lg rounded-2xl px-6 py-12  shadow-lg max-w-4xl w-full">
            <div className="flex flex-col gap-6">
              {/* Transaction Type Toggle Buttons */}
              <div className="flex justify-center">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant={transactionType === 'For Sale' ? 'default' : 'ghost'}
                    onClick={() => setTransactionType('For Sale')}
                    className={`px-6 py-2 ${
                      transactionType === 'For Sale'
                        ? 'bg-primary shadow-sm text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    For Sale
                  </Button>
                  <Button
                    variant={transactionType === 'For Rent' ? 'default' : 'ghost'}
                    onClick={() => setTransactionType('For Rent')}
                    className={`px-6 py-2 ${
                      transactionType === 'For Rent'
                        ? 'bg-primary shadow-sm text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    For Rent
                  </Button>
                </div>
              </div>

              {/* Search Input and Button */}
              <div className="flex w-full items-center gap-2">
                <div className="relative flex-1">
                  <GoogleSearch
                    selectedCity={(city : string) => {
                      setAddress(city)
                    }}
                  />
                </div>
                <Button
                  onClick={() => handleSearch()}
                  className="px-8"
                  disabled={!address}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Properties Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Latest Properties
          </h2>
          <Button variant="outline" onClick={() => router.push('/search')}>
            View All Properties
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
            ))}
          </div>
        ) : featuredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                view="card"
                property={property}
                url={`/properties/${property.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No properties available at the moment.</p>
          </div>
        )}
      </div>
    </main>
  )
}
