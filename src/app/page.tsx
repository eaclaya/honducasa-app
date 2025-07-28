"use client"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import GoogleSearch from "@/components/shared/google-search"

export default function Home() {
  const router = useRouter()
  const [address, setAddress] = useState('')

  const handleSearch = () => {
    router.push(`/search?address=${address}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative h-[600px] bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920")' }}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Find Your Dream Home
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Search thousands of properties for rent or sale
          </p>

          {/* Search Panel */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl px-6 py-12  shadow-lg max-w-4xl w-full">
            <div className="flex flex-col md:flex-row gap-4 items-end justify-evenly">
              <div className="flex w-full items-center gap-2">
                <div className="relative flex-1">
                  <GoogleSearch
                    selectedCity={(city : string) => setAddress(city)}
                  />
                </div>
                <Button
                  disabled={!address}
                  onClick={() => handleSearch()}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Properties Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Featured Properties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Property Cards will go here */}
        </div>
      </div>
    </main>
  )
}
