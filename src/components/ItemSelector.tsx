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
  const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
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
      const availableItems = excludeId 
        ? allItems.filter(item => item.id !== excludeId)
        : allItems
      setItems(availableItems)
      setFilteredItems(availableItems)
    } catch (error) {
      console.error('Error loading items:', error)
      setError('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items)
    } else {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredItems(filtered)
    }
  }, [searchTerm, items])

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
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items by name or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            🔍
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-gray-600 mt-2">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* No Results */}
      {filteredItems.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">🔍</div>
          <p className="text-gray-600 mb-2">No items match "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-blue-500 hover:text-blue-600 text-sm transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems.map((item) => {
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
      )}
      
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