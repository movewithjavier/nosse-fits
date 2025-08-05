'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { clothingService, ClothingItem } from '@/lib/supabase'
import D3GraphView from '@/components/D3GraphView'

export default function GraphPage() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await clothingService.getItems()
      setItems(data)
    } catch (error) {
      console.error('Error loading items:', error)
      setError('Failed to load wardrobe items')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-gray-800">Loading wardrobe network...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-800 mb-4">{error}</p>
          <Link 
            href="/"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Wardrobe
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Link 
                  href="/"
                  className="text-gray-800 hover:text-gray-900 transition-colors"
                >
                  ← Back to Wardrobe
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">Wardrobe Network</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">🕸️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Network Yet</h2>
            <p className="text-gray-600 mb-4">Add some clothing items to see your wardrobe network!</p>
            <Link 
              href="/add"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add First Item
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/"
                className="text-gray-800 hover:text-gray-900 transition-colors"
              >
                ← Back to Wardrobe
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Wardrobe Network</h1>
              <p className="text-gray-600 text-sm">
                {items.length} items • Drag to explore • Click nodes for details
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-140px)]">
        <D3GraphView items={items} />
      </main>
    </div>
  )
}