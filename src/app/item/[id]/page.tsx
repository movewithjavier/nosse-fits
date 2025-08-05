'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ClothingItem, MatchingItem, clothingService } from '@/lib/supabase'

export default function ItemDetail() {
  const router = useRouter()
  const params = useParams()
  const [item, setItem] = useState<ClothingItem | null>(null)
  const [matchingItems, setMatchingItems] = useState<MatchingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [matchingLoading, setMatchingLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [tempName, setTempName] = useState('')
  const [tempDescription, setTempDescription] = useState('')
  const [saving, setSaving] = useState(false)

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
        setTempName(foundItem.name)
        setTempDescription(foundItem.description || '')
        loadMatchingItems(foundItem.id)
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

  const loadMatchingItems = async (itemId: string) => {
    try {
      setMatchingLoading(true)
      const matches = await clothingService.getMatchingItems(itemId)
      setMatchingItems(matches)
    } catch (error) {
      console.error('Error loading matching items:', error)
    } finally {
      setMatchingLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!item || !confirm('Are you sure you want to delete this item?')) return
    
    try {
      setDeleting(true)
      await clothingService.deleteImage(item.image_path)
      await clothingService.deleteItem(item.id)
      router.push('/')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveName = async () => {
    if (!item || !tempName.trim() || tempName.trim() === item.name) {
      setEditingName(false)
      setTempName(item?.name || '')
      return
    }
    
    try {
      setSaving(true)
      const updatedItem = await clothingService.updateItem(item.id, {
        name: tempName.trim()
      })
      setItem(updatedItem)
      setEditingName(false)
    } catch (error) {
      console.error('Error updating name:', error)
      alert('Error updating name. Please try again.')
      setTempName(item.name)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDescription = async () => {
    if (!item || tempDescription.trim() === (item.description || '')) {
      setEditingDescription(false)
      setTempDescription(item?.description || '')
      return
    }
    
    try {
      setSaving(true)
      const updatedItem = await clothingService.updateItem(item.id, {
        description: tempDescription.trim()
      })
      setItem(updatedItem)
      setEditingDescription(false)
    } catch (error) {
      console.error('Error updating description:', error)
      alert('Error updating description. Please try again.')
      setTempDescription(item.description || '')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = (field: 'name' | 'description') => {
    if (field === 'name') {
      setEditingName(false)
      setTempName(item?.name || '')
    } else {
      setEditingDescription(false)
      setTempDescription(item?.description || '')
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
              href="/"
              className="text-gray-800 hover:text-gray-900 transition-colors flex items-center"
            >
              ← Back to Wardrobe
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete Item'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="lg:flex lg:gap-6">
          {/* Main Content */}
          <div className="lg:flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Image Section */}
              <div className="aspect-square relative max-w-lg mx-auto">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              
              {/* Content Section */}
              <div className="p-6">
                {/* Editable Name */}
                <div className="mb-4">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none flex-1"
                        maxLength={100}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName()
                          if (e.key === 'Escape') handleCancelEdit('name')
                        }}
                        disabled={saving}
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={saving || !tempName.trim()}
                        className="text-green-600 hover:text-green-700 text-sm px-2 py-1 disabled:text-gray-400"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleCancelEdit('name')}
                        disabled={saving}
                        className="text-red-600 hover:text-red-700 text-sm px-2 py-1 disabled:text-gray-400"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h1 className="text-2xl font-bold text-gray-900 flex-1">
                        {item.name}
                      </h1>
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Edit name"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Editable Description */}
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
                  {editingDescription ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        className="w-full text-gray-800 leading-relaxed bg-transparent border-2 border-blue-500 rounded-md p-2 focus:outline-none resize-none"
                        maxLength={500}
                        rows={3}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') handleCancelEdit('description')
                        }}
                        disabled={saving}
                        placeholder="Add a description..."
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveDescription}
                          disabled={saving}
                          className="text-green-600 hover:text-green-700 text-sm px-3 py-1 border border-green-600 rounded disabled:text-gray-400 disabled:border-gray-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleCancelEdit('description')}
                          disabled={saving}
                          className="text-gray-600 hover:text-gray-700 text-sm px-3 py-1 border border-gray-300 rounded disabled:text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group cursor-pointer" onClick={() => setEditingDescription(true)}>
                      {item.description ? (
                        <div className="flex items-start gap-2">
                          <p className="text-gray-800 leading-relaxed flex-1">
                            {item.description}
                          </p>
                          <button
                            className="text-gray-400 hover:text-gray-600 p-1 mt-1"
                            title="Edit description"
                          >
                            ✏️
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic hover:text-gray-700 transition-colors py-2">
                          Click to add description...
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Added:</span>
                    <span className="text-gray-800 ml-2">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {item.updated_at !== item.created_at && (
                    <div>
                      <span className="font-medium text-gray-700">Last updated:</span>
                      <span className="text-gray-800 ml-2">
                        {new Date(item.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Goes With Section */}
          <div className="lg:w-80 mt-6 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Goes With</h2>
                <Link
                  href={`/item/${item.id}/edit`}
                  className="text-blue-500 hover:text-blue-600 text-sm transition-colors"
                >
                  Edit
                </Link>
              </div>
              
              {matchingLoading ? (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">⏳</div>
                  <p className="text-gray-600 text-sm">Loading matches...</p>
                </div>
              ) : matchingItems.length > 0 ? (
                <div className="space-y-3">
                  {matchingItems.map((matchingItem) => (
                    <Link
                      key={matchingItem.id}
                      href={`/item/${matchingItem.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={matchingItem.image_url}
                          alt={matchingItem.name}
                          fill
                          className="object-cover rounded-md"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {matchingItem.name}
                        </h3>
                        {matchingItem.description && (
                          <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                            {matchingItem.description}
                          </p>
                        )}
                      </div>
                      <div className="text-gray-400">
                        →
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">👔</div>
                  <p className="text-gray-600 text-sm mb-3">No matching items yet</p>
                  <Link
                    href={`/item/${item.id}/edit`}
                    className="text-blue-500 hover:text-blue-600 text-sm transition-colors"
                  >
                    Add matching items
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}