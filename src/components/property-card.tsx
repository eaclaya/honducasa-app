"use client"
import { Button } from "@/components/ui/button"

interface Property {
  id: number
  title: string
  price: number
  bedrooms: number
  bathrooms: number
  location: string
  image: string
}

export function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48">
        <img
          src={property.image}
          alt={property.title}
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-600">${property.price.toLocaleString()}/month</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-600">{property.bedrooms} beds</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-600">{property.bathrooms} baths</span>
        </div>
        <p className="text-gray-600 mb-4">{property.location}</p>
        <Button className="w-full">View Details</Button>
      </div>
    </div>
  )
}
