'use client';
import Image from "next/image"
import Link from "next/link"
import { AuthButton } from "@/components/auth/auth-button"
import { AuthNav } from "@/components/auth/auth-nav"

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex ">
            <Link href="/" className="flex items-center gap-2 justify-center">
              <Image
                src="/images/logo.jpg"
                alt="HonduCasa Logo"
                width={40}
                height={40}

              />
              <span className="text-xl font-bold text-gray-800 mt-2">HonduCasa</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
              {/* Auth Nav */}
              <AuthNav />
              {/* Auth Section */}
              <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
