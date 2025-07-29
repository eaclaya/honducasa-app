"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import { MapPin, AlertCircle, Search, X } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

interface LocationData {
  latitude: number
  longitude: number
  address?: string
}

interface SearchResult {
  id: string
  place_name: string
  center: [number, number]
}

interface MapboxLocationPickerProps {
  onLocationSelect: (location: LocationData) => void
  initialLocation?: LocationData
  height?: string
}

export default function MapboxLocationPicker({
  onLocationSelect,
  initialLocation,
  height = "400px"
}: MapboxLocationPickerProps) {
  const [viewport, setViewport] = useState({
    latitude: initialLocation?.latitude || 14.0723, // Tegucigalpa, Honduras
    longitude: initialLocation?.longitude || -87.1921,
    zoom: initialLocation ? 15 : 10
  })

  const [markerLocation, setMarkerLocation] = useState<LocationData | null>(
    initialLocation || null
  )

  const [error, setError] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if Mapbox API key is configured
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      setHasApiKey(false)
      setError('Mapbox access token is not configured')
    }
  }, [])

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) return null

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&types=address,poi`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        return data.features[0].place_name
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
    return null
  }, [])

  // Handle map click to place marker
  const handleMapClick = useCallback(async (event: any) => {
    const { lngLat } = event
    const latitude = lngLat.lat
    const longitude = lngLat.lng

    // Get address for the clicked location
    const address = await reverseGeocode(latitude, longitude)

    const locationData: LocationData = {
      latitude,
      longitude,
      address: address || undefined
    }

    setMarkerLocation(locationData)
    onLocationSelect(locationData)
    setError(null)
  }, [onLocationSelect, reverseGeocode])

  // Handle geolocation success
  const handleGeolocate = useCallback((position: GeolocationPosition) => {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude

    setViewport(prev => ({
      ...prev,
      latitude,
      longitude,
      zoom: 15
    }))
  }, [])

  // Search for addresses using Mapbox geocoding
  const searchAddresses = useCallback(async (query: string) => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || !query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=5`
      )
      const data = await response.json()

      if (data.features) {
        const results: SearchResult[] = data.features.map((feature: any) => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center
        }))
        setSearchResults(results)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    }
    setIsSearching(false)
  }, [])

  // Handle search input change with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)

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
  const handleResultSelect = useCallback(async (result: SearchResult) => {
    const [longitude, latitude] = result.center

    setViewport({
      latitude,
      longitude,
      zoom: 15
    })

    const locationData: LocationData = {
      latitude,
      longitude,
      address: result.place_name
    }

    setMarkerLocation(locationData)
    onLocationSelect(locationData)
    setSearchQuery(result.place_name)
    setShowResults(false)
    setError(null)
  }, [onLocationSelect])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }, [])

  // Don't render if API key is missing
  if (!hasApiKey) {
    return (
      <div className="relative" style={{ height }}>
        <div className="flex items-center justify-center h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Mapbox access token not configured</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Search Input */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for an address..."
              className="w-full pl-10 pr-10 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-600">Searching...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Map
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />

        {/* Geolocation Control */}
        <GeolocateControl
          position="top-right"
          trackUserLocation={false}
          onGeolocate={handleGeolocate}
        />

        {/* Location Marker */}
        {markerLocation && (
          <Marker
            latitude={markerLocation.latitude}
            longitude={markerLocation.longitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <MapPin className="h-8 w-8 text-red-500 drop-shadow-lg" fill="currentColor" />
            </div>
          </Marker>
        )}
      </Map>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
        <p className="text-sm text-gray-700">
          Click on the map to set the property location
        </p>
      </div>

      {/* Location Info */}
      {markerLocation && (
        <div className="absolute bottom-16 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg max-w-xs">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Selected Location:</p>
              <p className="text-sm font-medium">
                {markerLocation.address || `${markerLocation.latitude.toFixed(6)}, ${markerLocation.longitude.toFixed(6)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-100 text-red-700 px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}