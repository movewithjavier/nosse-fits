'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ClothingItem, MatchingItem, clothingService } from '@/lib/supabase'
import ItemSelector from '@/components/ItemSelector'

export default function EditItemMatches() {
  const router = useRouter()
  const params = useParams()
  const [item, setItem] = useState<ClothingItem | null>(null)
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')

  useEffect(() => {
    loadItem()
  }, [params.id])

  const loadItem = async () => {
    try {
      setLoading(true)
      const items = await clothingService.getItems()
      const foundItem = items.find(item => item.id === params.id)
      
      if (foundItem) {
        setItem(foundItem)
        setItemName(foundItem.name)
        setItemDescription(foundItem.description || '')
        // Load existing matches
        const matches = await clothingService.getMatchingItems(foundItem.id)
        setSelectedMatchIds(matches.map(match => match.id))
      } else {
        setError('Item not found')
      }
    } catch (error) {
      console.error('Error loading item:', error)
      setError('Failed to load item')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!item) return
    
    try {
      setSaving(true)
      
      // Update item name and description if changed
      if (itemName.trim() !== item.name || itemDescription.trim() !== (item.description || '')) {
        await clothingService.updateItem(item.id, {
          name: itemName.trim(),
          description: itemDescription.trim()
        })
      }
      
      // Update matches
      await clothingService.setMatches(item.id, selectedMatchIds)
      router.push(`/item/${item.id}`)
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Error saving changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-800">Loading item...</p>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-800 mb-4">{error || 'Item not found'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/item/${item.id}`}
              className="text-gray-800 hover:text-gray-900 transition-colors flex items-center"
            >
              ← Back to Item
            </Link>
            <div className="flex gap-3">
              <Link
                href={`/item/${item.id}`}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  saving 
                    ? 'bg-gray-100 text-gray-400 pointer-events-none' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving || !itemName.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Current Item Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover rounded-lg"
                sizes="64px"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-3">
                Edit Item
              </h1>
              
              {/* Name Input */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={100}
                  required
                />
              </div>
              
              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={500}
                  rows={2}
                  placeholder="Size, brand, notes..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Item Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Choose matching items (optional)
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Select items that go well with this piece
          </p>
          <ItemSelector
            selectedIds={selectedMatchIds}
            onSelectionChange={setSelectedMatchIds}
            excludeId={item.id}
          />
        </div>
      </main>
    </div>
  )
}