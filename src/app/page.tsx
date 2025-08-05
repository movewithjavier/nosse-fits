'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { clothingService, ClothingItem } from '@/lib/supabase'
import ItemGrid from '@/components/ItemGrid'

export default function Home() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'input' | 'inventory'>('input')

  useEffect(() => {
    // Set default view based on screen size
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      setView(isMobile ? 'input' : 'inventory')
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    loadItems()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadItems = async () => {
    try {
      const data = await clothingService.getItems()
      setItems(data)
      setFilteredItems(data)
    } catch (error) {
      console.error('Error loading items:', error)
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


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-800">Loading...</div>
      </div>
    )
  }

  // Show input form directly on mobile, inventory on tablet+
  if (view === 'input') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Nosse Fits</h1>
              <button 
                onClick={() => setView('inventory')}
                className="text-sm text-blue-700 hover:text-blue-900 transition-colors flex items-center gap-1"
              >
                📦 View Inventory
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👕</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Add New Item</h2>
            <p className="text-gray-800">
              {items.length === 0 ? 'Add your first item' : `${items.length} item${items.length !== 1 ? 's' : ''} in wardrobe`}
            </p>
          </div>
          
          <Link 
            href="/add"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg text-lg font-medium transition-colors text-center mb-4"
          >
            📷 Take Photo & Add Item
          </Link>
          
          {items.length > 0 && (
            <button 
              onClick={() => setView('inventory')}
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 rounded-lg font-medium transition-colors text-center"
            >
              View All Items ({items.length})
            </button>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Nosse Fits</h1>
            <div className="flex items-center gap-4">
              {items.length > 0 && (
                <Link
                  href="/graph"
                  className="text-sm text-purple-700 hover:text-purple-900 transition-colors flex items-center gap-1"
                >
                  🕸️ Network
                </Link>
              )}
              <button 
                onClick={() => setView('input')}
                className="md:hidden text-sm text-blue-700 hover:text-blue-900 transition-colors flex items-center gap-1"
              >
                ➕ Add Item
              </button>
              <Link 
                href="/add"
                className="hidden md:flex bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors items-center gap-2"
              >
                <span className="text-lg">+</span>
                Add Item
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {items.length === 0 ? 'Your Wardrobe' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </h2>
            {items.length > 0 && (
              <p className="text-gray-800 text-sm">
                {searchTerm ? `${filteredItems.length} of ${items.length} items` : 'Tap on an item to view or delete'}
              </p>
            )}
          </div>
        </div>

        {/* Search Input */}
        {items.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your wardrobe..."
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
          </div>
        )}

        {/* No Results Message */}
        {searchTerm && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-600 mb-2">No items match "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              Clear search
            </button>
          </div>
        )}

        <ItemGrid items={filteredItems} onUpdate={loadItems} />
      </main>
    </div>
  )
}