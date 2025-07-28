"use client"

import { useState, useEffect, useCallback } from "react"
import { PropertyCard } from "@/components/property-card"
import { useSearchParams } from "next/navigation"
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Property {
  id: string
  type: string
  price: number
  beds: number
  baths: number
  address: string
  // Add other property fields as needed
}

interface FilterState {
  price: { min: string; max: string }
  type: string
  beds: number
  baths: number
  address: string
}

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchProperties = useCallback(async (filters: FilterState) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('properties')
        .select('*')

      // Apply filters
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }
      if (filters.price.min) {
        query = query.gte('price', parseInt(filters.price.min))
      }
      if (filters.price.max) {
        query = query.lte('price', parseInt(filters.price.max))
      }
      if (filters.beds) {
        query = query.gte('beds', filters.beds)
      }
      if (filters.baths) {
        query = query.gte('baths', filters.baths)
      }
      if (filters.address) {
        query = query.ilike('address', `%${filters.address}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setProperties(data || [])
    } catch (err) {
      console.error('Error fetching properties:', err)
      setError('Failed to fetch properties. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    const filters: FilterState = {
      price: { min: '', max: '' },
      type: 'all',
      beds: 0,
      baths: 0,
      address: '',
    }

    // Parse price range
    if (params.price) {
      try {
        const price = JSON.parse(params.price)
        filters.price = {
          min: price.min || '',
          max: price.max || ''
        }
      } catch (e) {
        console.error('Error parsing price:', e)
      }
    }

    // Parse other filters
    if (params.type) filters.type = params.type
    if (params.beds) filters.beds = parseInt(params.beds)
    if (params.baths) filters.baths = parseInt(params.baths)
    if (params.address) filters.address = params.address

    fetchProperties(filters)
  }, [searchParams, fetchProperties])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading properties...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-lg">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Results</h1>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600 mb-4">No properties found</h2>
          <p className="text-gray-500">Try adjusting your search filters to see more results.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-6">Found {properties.length} properties</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}