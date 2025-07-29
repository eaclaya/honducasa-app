"use client"

import { useState, useEffect, useCallback } from 'react'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import { MapPin, AlertCircle } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

interface LocationData {
  latitude: number
  longitude: number
  address?: string
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
      <Map
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
        className="rounded-lg"
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
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg max-w-xs">
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