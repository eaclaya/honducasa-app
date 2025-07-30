import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"

interface PropertyFiltersProps {
  filters: {
    price: { min: string; max: string }
    property_type: string
    transaction_type: string
    rooms: number
    baths: number
    area: { min: string; max: string }
    address: string
  }
  onFilterChange: (field: string, value: string | number | { min: string; max: string }) => void
}

export function PropertyFilters({ filters, onFilterChange }: PropertyFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()

  const propertyTypes = [
    { value: "all", label: "All Types" },
    { value: "Apartment", label: "Apartment" },
    { value: "House", label: "House" },
    { value: "Land", label: "Land" }
  ]

  const transactionTypes = [
    { value: "all", label: "All Transactions" },
    { value: "For Sale", label: "For Sale" },
    { value: "For Rent", label: "For Rent" },
  ]

  const updateFiltersAndNavigate = (field: string, value: string | number | { min: string; max: string }) => {
    // Create new URLSearchParams from current URL
    const newSearchParams = new URLSearchParams(currentSearchParams.toString())

    // Update the specific parameter
    if (value && value !== '' && value !== 'all' && value !== 0) {
      newSearchParams.set(field, typeof value === 'object' ? JSON.stringify(value) : value.toString())
    } else {
      newSearchParams.delete(field)
    }

    // Update URL - this will trigger the search page useEffect
    const newUrl = `/search?${newSearchParams.toString()}`
    router.push(newUrl)
  }

  const updateLocalState = (field: string, value: string | number | { min: string; max: string }) => {
    // Only update local state for immediate UI feedback
    onFilterChange(field, value)
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
              onChange={(e) => updateLocalState('price', { ...filters.price, min: e.target.value })}
              onBlur={(e) => updateFiltersAndNavigate('price', { ...filters.price, min: e.target.value })}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.price.max}
              onChange={(e) => updateLocalState('price', { ...filters.price, max: e.target.value })}
              onBlur={(e) => updateFiltersAndNavigate('price', { ...filters.price, max: e.target.value })}
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
            value={filters.property_type}
            onValueChange={(value) => updateFiltersAndNavigate('property_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Transaction Type
          </label>
          <Select
            value={filters.transaction_type}
            onValueChange={(value) => updateFiltersAndNavigate('transaction_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select transaction type" />
            </SelectTrigger>
            <SelectContent>
              {transactionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rooms */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Rooms
          </label>
          <Select
            value={filters.rooms.toString()}
            onValueChange={(value) => updateFiltersAndNavigate('rooms', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select number of rooms" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {`${num}+`}
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
            value={filters.baths.toString()}
            onValueChange={(value) => updateFiltersAndNavigate('baths', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select number of bathrooms" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Area Range */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Area (m²)
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.area.min}
              onChange={(e) => updateLocalState('area', { ...filters.area, min: e.target.value })}
              onBlur={(e) => updateFiltersAndNavigate('area', { ...filters.area, min: e.target.value })}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.area.max}
              onChange={(e) => updateLocalState('area', { ...filters.area, max: e.target.value })}
              onBlur={(e) => updateFiltersAndNavigate('area', { ...filters.area, max: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <Input
            placeholder="Enter city, neighborhood, or address"
            value={filters.address}
            onChange={(e) => updateLocalState('address', e.target.value)}
            onBlur={(e) => updateFiltersAndNavigate('address', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
