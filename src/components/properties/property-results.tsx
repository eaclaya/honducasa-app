import { LayoutGrid, LayoutList } from "lucide-react";
import { PropertyCard } from "../property-card";
import type { ImageInput } from "@/utils/image-helpers";
import { useState } from "react";

interface PropertyResultProps {
    properties: {
        id: number
        title: string
        description: string | null
        price: number | null
        currency: string | null
        property_type: string | null
        transaction_type: string | null
        area: number | null
        full_area?: number | null
        rooms: number | null
        baths: number | null
        address: string | null
        location: string | {latitude: number, longitude: number} | null
        images: ImageInput[] | string[] | null
        favorites?: { property_id: number, user_id: string }[]
    }[]
}

export default function PropertyResult({ properties }: PropertyResultProps) {
    const [view, setView] = useState<'list' | 'card'>('list')
	return (
		<div className="lg:col-span-3">
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl text-gray-600 mb-4">No properties found</h2>
              <p className="text-gray-500">Try adjusting your search filters to see more results.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">Found {properties.length} properties</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setView('list')} className={`p-2 cursor-pointer rounded ${
                    view === 'list' ? 'bg-primary text-white' : ''
                  }`}><LayoutList /></button>
                  <button onClick={() => setView('card')} className={`p-2 cursor-pointer rounded ${
                    view === 'card' ? 'bg-primary text-white' : ''
                  }`}><LayoutGrid /></button>
                </div>
              </div>
              <div className={view === 'list' ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"}>
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    view={view}
                    url={`/properties/${property.id}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
	);
}
