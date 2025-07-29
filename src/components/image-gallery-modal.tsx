"use client"
import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { getOriginalImageUrl, type ImageInput } from "@/utils/image-helpers"

interface ImageGalleryModalProps {
  images: (ImageInput | string)[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function ImageGalleryModal({
  images,
  isOpen,
  onClose,
  initialIndex = 0
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  const handlePrevious = () => {
    setCurrentIndex((prev) => prev > 0 ? prev - 1 : images.length - 1)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => prev < images.length - 1 ? prev + 1 : 0)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) => prev > 0 ? prev - 1 : images.length - 1)
      } else if (event.key === "ArrowRight") {
        setCurrentIndex((prev) => prev < images.length - 1 ? prev + 1 : 0)
      } else if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [isOpen, onClose, images.length])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      {/* Close button */}
      <button
        className="absolute top-6 right-6 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-lg flex items-center justify-center transition-colors"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      {/* Current image */}
      <img
        src={getOriginalImageUrl(images[currentIndex] as ImageInput)}
        alt={`Property image ${currentIndex + 1}`}
        className="w-full h-full object-contain"
      />

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20 h-12 w-12 rounded-lg flex items-center justify-center transition-colors"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20 h-12 w-12 rounded-lg flex items-center justify-center transition-colors"
            onClick={handleNext}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}
    </div>
  )
}