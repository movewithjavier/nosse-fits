'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ClothingItem, clothingService } from '@/lib/supabase'

export default function ItemDetail() {
  const router = useRouter()
  const params = useParams()
  const [item, setItem] = useState<ClothingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      <main className="max-w-4xl mx-auto px-4 py-6">
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {item.name}
            </h1>
            
            {item.description && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
                <p className="text-gray-800 leading-relaxed">
                  {item.description}
                </p>
              </div>
            )}
            
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
      </main>
    </div>
  )
}