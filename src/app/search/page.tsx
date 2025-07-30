"use client"

import { useState, useEffect, useCallback } from "react"
import { PropertyFilters } from "@/components/property-filters"
import { useSearchParams } from "next/navigation"
import { createClient } from '@/utils/supabase/client'
import { type ImageInput } from '@/utils/image-helpers'
import PropertyResults from "@/components/properties/property-results"
import { SkeletonCard } from "@/components/properties/skeleton-card"
import { useAuthStore } from '@/stores/auth-store'

interface Property {
  id: number
  title: string
  description: string | null
  price: number | null
  currency: string | null
  property_type: string | null
  transaction_type: string | null
  area: number | null
  rooms: number | null
  baths: number | null
  address: string | null
  location: string | {latitude: number, longitude: number} | null
  images: ImageInput[] | string[] | null
  favorites?: { property_id: number, user_id: string }[]
}

interface FilterState {
  price: { min: string; max: string }
  property_type: string
  transaction_type: string
  rooms: number
  baths: number
  area: { min: string; max: string }
  address: string
}

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    price: { min: '', max: '' },
    property_type: 'all',
    transaction_type: 'all',
    rooms: 0,
    baths: 0,
    area: { min: '', max: '' },
    address: ''
  })

  const supabase = createClient()
  const searchParams = useSearchParams()
  const { initialized } = useAuthStore()

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchProperties = useCallback(async (filters: FilterState) => {
    // Check if auth is initialized
    const { initialized: isInitialized } = useAuthStore.getState()
    if (!isInitialized) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Get current user state from store
      const currentUser = useAuthStore.getState().user
      
      let query = supabase
        .from('properties')
        .select('*')

      // Only include favorites if user is authenticated
      if (currentUser) {
        query = query.select('*, favorites(*)')
        query = query.eq('favorites.user_id', currentUser.id)
      }

      // Apply filters
      if (filters.property_type !== 'all') {
        query = query.eq('property_type', filters.property_type)
      }
      if (filters.transaction_type !== 'all') {
        query = query.eq('transaction_type', filters.transaction_type)
      }
      if (filters.price.min) {
        query = query.gte('price', parseInt(filters.price.min))
      }
      if (filters.price.max) {
        query = query.lte('price', parseInt(filters.price.max))
      }
      if (filters.rooms) {
        query = query.gte('rooms', filters.rooms)
      }
      if (filters.baths) {
        query = query.gte('baths', filters.baths)
      }
      if (filters.area.min) {
        query = query.gte('area', parseInt(filters.area.min))
      }
      if (filters.area.max) {
        query = query.lte('area', parseInt(filters.area.max))
      }
      if (filters.address) {
        query = query.ilike('address', `%${filters.address}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
      setError('Failed to fetch properties. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!initialized) return

    const params = Object.fromEntries(searchParams.entries())
    const newFilters: FilterState = {
      price: { min: '', max: '' },
      property_type: 'all',
      transaction_type: 'all',
      rooms: 1,
      baths: 1,
      area: { min: '', max: '' },
      address: '',
    }

    // Parse price range
    if (params.price) {
      try {
        const price = JSON.parse(params.price)
        newFilters.price = {
          min: price.min || '',
          max: price.max || ''
        }
      } catch (e) {
        console.error('Error parsing price:', e)
      }
    }

    // Parse area range
    if (params.area) {
      try {
        const area = JSON.parse(params.area)
        newFilters.area = {
          min: area.min || '',
          max: area.max || ''
        }
      } catch (e) {
        console.error('Error parsing area:', e)
      }
    }

    // Parse other filters
    if (params.property_type) newFilters.property_type = params.property_type
    if (params.transaction_type) newFilters.transaction_type = params.transaction_type
    if (params.rooms) newFilters.rooms = parseInt(params.rooms)
    if (params.baths) newFilters.baths = parseInt(params.baths)
    if (params.address) newFilters.address = params.address

    setFilters(newFilters)
    fetchProperties(newFilters)
  }, [searchParams, initialized, fetchProperties])

  const handleFilterChange = (field: string, value: string | number | { min: string; max: string }) => {
    // Only update local state for UI responsiveness
    // The actual API call will be triggered by URL change
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
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
    <div className="container mx-auto px-4 py-8 ">
      <h1 className="text-2xl font-bold mb-4">Properties in {filters.address}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
            <PropertyFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        {loading ? <div className="col-span-3"><SkeletonCard /></div> :
        <PropertyResults properties={properties} />
        }
      </div>
    </div>
  )
}