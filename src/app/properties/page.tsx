"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PropertyCard } from '@/components/property-card'
import { Button } from '@/components/ui/button'
import { type ImageInput } from '@/utils/image-helpers'
import Link from 'next/link'
import { SkeletonCard } from '@/components/properties/skeleton-card'

interface Property {
  id: number
  description: string | null
  price: number | null
  currency: string | null
  property_type: string | null
  transaction_type: string | null
  area: number | null
  rooms: number | null
  baths: number | null
  address: string | null
  location: unknown
  images: ImageInput[] | string[] | null
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Properties</h1>
          <Link href="/properties/create">
            <Button className='cursor-pointer'>Add Property</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Properties</h1>
        <Link href="/properties/create">
          <Button className='cursor-pointer'>Add Property</Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No properties found</h2>
          <p className="text-gray-600 mb-6">Start by adding your first property</p>
          <Link href="/properties/create">
            <Button className='cursor-pointer'>Add Property</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              view="list"
              property={property}
              url={`/properties/${property.id}/edit`}
            />
          ))}
        </div>
      )}
    </div>
  )
}