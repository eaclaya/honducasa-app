import { Input } from "@/components/ui/input";
import { usePlacesWidget } from "react-google-autocomplete";
import { useState } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface GoogleSearchProps {
    selectedAddress?: (address: string) => void;
    selectedLocation?: (lat: number, lng: number) => void;
    selectedCity?: (city: string) => void;
}

export default function GoogleSearch({ selectedAddress, selectedLocation, selectedCity }: GoogleSearchProps) {
    const [loading, setLoading] = useState(false)
    const [isSelected, setIsSelected] = useState(false)

    const { ref } = usePlacesWidget({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        onPlaceSelected: (place) => {
            const city = place.address_components?.[0]?.long_name
            selectedCity?.(city)
            selectedAddress?.(place.formatted_address)
            selectedLocation?.(place.geometry.location.lat(), place.geometry.location.lng())
            setIsSelected(true)
        }
      })

      const removeSelection = () => {
        setIsSelected(false)
        selectedAddress?.('')
        selectedLocation?.(0, 0)
        selectedCity?.('')
        document.getElementById('google-search-input').value = ''
      }

        return (
        <div className="relative">
            <Input
                id="google-search-input"
                ref={ref}
                placeholder="Enter city, state, or address..."
                className="w-full pr-12"
                disabled={isSelected}
                auto-complete="off"

            />
            {isSelected && (
                <Button
                    variant="ghost"
                    onClick={removeSelection}
                    className="absolute right-0 top-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}