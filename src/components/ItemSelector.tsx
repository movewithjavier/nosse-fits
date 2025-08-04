'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ClothingItem, clothingService } from '@/lib/supabase'

interface ItemSelectorProps {
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  excludeId?: string // Exclude the current item from selection
  className?: string
}

export default function ItemSelector({ 
  selectedIds, 
  onSelectionChange, 
  excludeId,
  className = '' 
}: ItemSelectorProps) {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const allItems = await clothingService.getItems()
      // Filter out the current item if excludeId is provided
      const filteredItems = excludeId 
        ? allItems.filter(item => item.id !== excludeId)
        : allItems
      setItems(filteredItems)
    } catch (error) {
      console.error('Error loading items:', error)
      setError('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (itemId: string) => {
    const newSelection = selectedIds.includes(itemId)
      ? selectedIds.filter(id => id !== itemId)
      : [...selectedIds, itemId]
    onSelectionChange(newSelection)
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-2xl mb-2">⏳</div>
        <p className="text-gray-600">Loading items...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-2xl mb-2">❌</div>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-2xl mb-2">👕</div>
        <p className="text-gray-600">No other items available</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id)
          return (
            <div
              key={item.id}
              onClick={() => toggleSelection(item.id)}
              className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="aspect-square relative overflow-hidden rounded-md">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="150px"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                      ✓
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2">
                <h4 className="text-xs font-medium text-gray-900 line-clamp-2">
                  {item.name}
                </h4>
              </div>
            </div>
          )
        })}
      </div>
      
      {selectedIds.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  )
}