"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import GoogleSearch from '@/components/shared/google-search'
import MapboxLocationPicker from '@/components/shared/mapbox-location-picker'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'


export default function CreateProperty() {
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
  }, [])

  const handleCreate = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            address,
            location: location,
            created_by: user?.id,
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Redirect to edit page
      router.push(`/properties/${data.id}/edit`)
    } catch (err) {
      console.error('Error creating property:', err)
      setError('Failed to create property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-grow items-center justify-center w-full max-w-2xl mx-auto" >
      <h1 className="text-3xl font-bold mb-8">Post New Property</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="w-full">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for Address
            </label>
            <GoogleSearch
              selectedAddress={(address) => {
                setAddress(address)
              }}
              selectedLocation={(lat, lng) => {
                setLocation({ latitude: lat, longitude: lng })
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Set Exact Location on Map
            </label>
            <MapboxLocationPicker
              onLocationSelect={(locationData) => {
                setLocation({
                  latitude: locationData.latitude,
                  longitude: locationData.longitude
                })
                if (locationData.address && !address) {
                  setAddress(locationData.address)
                }
              }}
              initialLocation={location ? {
                latitude: location.latitude,
                longitude: location.longitude,
                address: address
              } : undefined}
              height="300px"
            />
          </div>

          <div className="flex justify-between items-center">
            <Button
              onClick={handleCreate}
              disabled={loading || !address || !location}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}