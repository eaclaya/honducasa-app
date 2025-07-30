"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, X, MapPin, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface MapboxSearchProps {
  selectedAddress?: (address: string) => void
  selectedLocation?: (lat: number, lng: number) => void
  selectedCity?: (city: string) => void
  placeholder?: string
  className?: string
}

interface SearchResult {
  id: string
  place_name: string
  center: [number, number]
}

export default function MapboxSearch({ 
  selectedAddress, 
  selectedLocation, 
  selectedCity,
  placeholder = "Search for a location...",
  className = ""
}: MapboxSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(true)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if Mapbox API key is configured
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      setHasApiKey(false)
      setError('Mapbox access token is not configured')
    }
  }, [])

  // Helper function to extract city from place name
  const extractCity = (placeName: string) => {
    // Split by comma and get the most relevant part (usually city comes first or second)
    const parts = placeName.split(',').map(part => part.trim())
    
    // For most cases, the city is in the first or second part
    // Skip very specific addresses and get the broader location
    if (parts.length >= 2) {
      // If first part looks like a street address (contains numbers), use second part
      if (/\d/.test(parts[0])) {
        return parts[1] || parts[0]
      }
      return parts[0]
    }
    
    return parts[0] || placeName
  }

  // Search for addresses using Mapbox geocoding
  const searchAddresses = useCallback(async (query: string) => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || !query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError(null)
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=5&types=place,locality,neighborhood,address`
      )
      
      if (!response.ok) {
        throw new Error('Search request failed')
      }
      
      const data = await response.json()

      if (data.features) {
        const results: SearchResult[] = data.features.map((feature: { id: string; place_name: string; center: [number, number] }) => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center
        }))
        setSearchResults(results)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Search failed. Please try again.')
      setSearchResults([])
    }
    setIsSearching(false)
  }, [])

  // Handle search input change with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setIsSelected(false)
    setError(null)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddresses(value)
      }, 500)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchAddresses])

  // Handle search result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    const [longitude, latitude] = result.center
    const city = extractCity(result.place_name)

    setSearchQuery(result.place_name)
    setShowResults(false)
    setIsSelected(true)
    setError(null)

    // Call callbacks
    selectedAddress?.(result.place_name)
    selectedLocation?.(latitude, longitude)
    selectedCity?.(city)
  }, [selectedAddress, selectedLocation, selectedCity])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
    setIsSelected(false)
    setError(null)
    
    // Call callbacks with empty values
    selectedAddress?.('')
    selectedLocation?.(0, 0)
    selectedCity?.('')
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }, [selectedAddress, selectedLocation, selectedCity])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Don't render if API key is missing
  if (!hasApiKey) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Mapbox access token not configured"
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            disabled
          />
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${isSelected ? 'bg-gray-50' : 'bg-white'}`}
          disabled={isSelected}
        />
        
        {/* Clear button */}
        {(searchQuery || isSelected) && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {searchResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-100"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{result.place_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Searching...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}