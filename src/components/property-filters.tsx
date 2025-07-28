import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface PropertyFiltersProps {
  filters: {
    price: { min: string; max: string }
    type: string
    bedrooms: number
    bathrooms: number
    location: string
  }
  onFilterChange: (field: string, value: any) => void
}

export function PropertyFilters({ filters, onFilterChange }: PropertyFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()

  const types = [
    { value: "all", label: "All Types" },
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "condo", label: "Condo" },
    { value: "townhouse", label: "Townhouse" }
  ]

  const updateFiltersAndNavigate = (field: string, value: any) => {
    onFilterChange(field, value)
    
    // Create new URLSearchParams from current URL
    const newSearchParams = new URLSearchParams(currentSearchParams.toString())
    
    // Update the specific parameter
    if (value) {
      newSearchParams.set(field, typeof value === 'object' ? JSON.stringify(value) : value.toString())
    } else {
      newSearchParams.delete(field)
    }

    // Update URL
    const newUrl = `/search?${newSearchParams.toString()}`
    router.push(newUrl)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Filters</h3>
      </div>

      <div className="flex flex-col gap-4">
        {/* Price Range */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Price Range
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.price.min}
              onChange={(e) => updateFiltersAndNavigate('price', { ...filters.price, min: e.target.value })}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.price.max}
              onChange={(e) => updateFiltersAndNavigate('price', { ...filters.price, max: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        {/* Property Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Property Type
          </label>
          <Select
            value={filters.type}
            onValueChange={(value) => updateFiltersAndNavigate('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bedrooms */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Bedrooms
          </label>
          <Select
            value={filters.bedrooms.toString()}
            onValueChange={(value) => updateFiltersAndNavigate('bedrooms', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select number of bedrooms" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}+ Beds
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bathrooms */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Bathrooms
          </label>
          <Select
            value={filters.bathrooms.toString()}
            onValueChange={(value) => updateFiltersAndNavigate('bathrooms', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select number of bathrooms" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}+ Baths
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <Input
            placeholder="Enter city, neighborhood, or address"
            value={filters.location}
            onChange={(e) => updateFiltersAndNavigate('location', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
