import { Input } from "@/components/ui/input";
import { usePlacesWidget } from "react-google-autocomplete";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { X, AlertCircle } from "lucide-react";

interface GoogleSearchProps {
    selectedAddress?: (address: string) => void;
    selectedLocation?: (lat: number, lng: number) => void;
    selectedCity?: (city: string) => void;
}

export default function GoogleSearch({ selectedAddress, selectedLocation, selectedCity }: GoogleSearchProps) {
    const [isSelected, setIsSelected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasApiKey, setHasApiKey] = useState(true)

    // Check if Google Maps API key is configured
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
            setHasApiKey(false)
            setError('Google Maps API key is not configured')
        }
    }, [])

    // Helper function to extract city from Google Places address components
    const extractCityFromComponents = (addressComponents: any[]) => {
        if (!addressComponents || !Array.isArray(addressComponents)) {
            return null
        }

        // Look for city in order of preference
        const cityTypes = ['locality', 'administrative_area_level_1', 'administrative_area_level_2', 'sublocality']

        for (const cityType of cityTypes) {
            const component = addressComponents.find(comp =>
                comp.types && comp.types.includes(cityType)
            )
            if (component?.long_name) {
                return component.long_name
            }
        }

        // Fallback to first component if no city-like component found
        return addressComponents[0]?.long_name || null
    }

    const { ref } = usePlacesWidget({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        onPlaceSelected: (place) => {
            try {
                setError(null)

                // Validate place data
                if (!place || !place.formatted_address) {
                    throw new Error('Invalid place data received')
                }

                // Extract city using improved logic
                const city = extractCityFromComponents(place.address_components)

                // Get coordinates if available
                let lat = 0, lng = 0
                if (place.geometry?.location) {
                    if (typeof place.geometry.location.lat === 'function') {
                        lat = place.geometry.location.lat()
                        lng = place.geometry.location.lng()
                    } else {
                        lat = place.geometry.location.lat || 0
                        lng = place.geometry.location.lng || 0
                    }
                }

                // Call callbacks with validated data
                selectedCity?.(city || '')
                selectedAddress?.(place.formatted_address || '')
                selectedLocation?.(lat, lng)
                setIsSelected(true)
            } catch (err) {
                console.error('Error processing place selection:', err)
                setError('Failed to process selected location')
            }
        },
        options: {
            types: ['(cities)'], // Restrict to cities for better results
        }
    })

      useEffect(() => {
        ref.current?.focus()
      }, [])

      const removeSelection = () => {
        setIsSelected(false)
        setError(null)
        selectedAddress?.('')
        selectedLocation?.(0, 0)
        selectedCity?.('')

        // Safely clear the input value
        if (ref?.current) {
            const inputElement = ref.current as HTMLInputElement
            inputElement.value = ''
            inputElement.focus()
        }
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
            // Clear any pending operations
            setError(null)
            setIsSelected(false)
        }
      }, [])

    // Don't render if API key is missing
    if (!hasApiKey) {
        return (
            <div className="relative">
                <Input
                    placeholder="Google Maps API key not configured"
                    className="w-full pr-12"
                    disabled={true}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            <Input
                id="google-search-input"
                ref={ref}
                placeholder="Enter city, state, or address..."
                className={`w-full pr-12 ${error ? 'border-red-500' : ''}`}
                disabled={isSelected}
                autoComplete="off"
            />

            {/* Error state */}
            {error && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2" title={error}>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
            )}

            {/* Clear button when location is selected */}
            {isSelected && !error && (
                <Button
                    variant="ghost"
                    onClick={removeSelection}
                    className="absolute right-0 top-0 h-full px-3"
                    title="Clear selection"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}

            {/* Error message */}
            {error && (
                <div className="absolute top-full left-0 mt-1 text-sm text-red-600">
                    {error}
                </div>
            )}
        </div>
    )
}