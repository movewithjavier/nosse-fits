'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { clothingService } from '@/lib/supabase'

export default function AddItem() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'saving' | 'success'>('idle')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, image: file })
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setFormData({ ...formData, image: null })
    // Reset file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.image || !formData.name.trim()) return

    setLoading(true)
    setUploadProgress(0)
    setUploadStatus('uploading')
    
    try {
      // Use a static user ID for personal use
      const userId = 'personal-user'
      
      // Simulate upload progress
      setUploadProgress(20)
      
      // Upload image
      const { path, url } = await clothingService.uploadImage(
        formData.image, 
        userId
      )
      
      setUploadProgress(70)
      setUploadStatus('saving')

      // Save item to database
      await clothingService.addItem({
        name: formData.name.trim(),
        description: formData.description.trim(),
        image_url: url,
        image_path: path,
        user_id: userId
      })

      setUploadProgress(100)
      setUploadStatus('success')
      
      // Brief delay to show success state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/')
    } catch (error) {
      console.error('Error adding item:', error)
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        alert(`Error adding item: ${error.message}`)
      } else {
        console.error('Unknown error:', error)
        alert('Error adding item. Please try again.')
      }
    } finally {
      setLoading(false)
      setUploadProgress(0)
      setUploadStatus('idle')
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link 
              href="/"
              className="mr-4 text-gray-800 hover:text-gray-900 transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Add New Item</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Photo *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
              {imagePreview ? (
                <div className="relative">
                  <div className="relative aspect-square max-w-sm mx-auto">
                    <Image 
                      src={imagePreview} 
                      alt="Preview" 
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    ×
                  </button>
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-sm text-gray-800 hover:text-gray-900 underline"
                    >
                      Choose a different photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    required
                  />
                  <label 
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <div className="text-gray-400 text-6xl mb-4">📷</div>
                    <p className="text-gray-800 text-lg mb-2">Tap to take photo or upload</p>
                    <p className="text-gray-700 text-sm">JPG, PNG, or GIF up to 10MB</p>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Blue striped shirt"
              maxLength={100}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
            <p className="text-xs text-gray-700 mt-1">
              {formData.name.length}/100 characters
            </p>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Size, brand, notes..."
              maxLength={500}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-700 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/"
              className={`flex-1 py-3 rounded-lg text-lg font-medium text-center transition-colors ${
                loading 
                  ? 'bg-gray-100 text-gray-400 pointer-events-none' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.image || !formData.name.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg text-lg font-medium transition-colors relative overflow-hidden"
            >
              {loading && (
                <div 
                  className="absolute inset-0 bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              )}
              <span className="relative z-10">
                {uploadStatus === 'uploading' && '📤 Uploading...'}
                {uploadStatus === 'saving' && '💾 Saving...'}
                {uploadStatus === 'success' && '✅ Saved!'}
                {uploadStatus === 'idle' && 'Save Item'}
              </span>
            </button>
          </div>
          
          {/* Progress Bar */}
          {loading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>
                  {uploadStatus === 'uploading' && 'Uploading photo...'}
                  {uploadStatus === 'saving' && 'Saving to wardrobe...'}
                  {uploadStatus === 'success' && 'Complete!'}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}