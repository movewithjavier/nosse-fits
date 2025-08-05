'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { clothingService } from '@/lib/supabase'
import ItemSelector from '@/components/ItemSelector'

export default function AddItem() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'rate-limiting' | 'retrying' | 'saving' | 'success'>('idle')
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([])
  const [showMatches, setShowMatches] = useState(false)

  // Monitor network connectivity and track page load time
  useEffect(() => {
    // Track when page loaded for rate limiting detection
    (window as any).pageLoadTime = Date.now()
    
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

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
    // Reset both file inputs
    const cameraInput = document.getElementById('camera-upload') as HTMLInputElement
    const galleryInput = document.getElementById('gallery-upload') as HTMLInputElement
    if (cameraInput) cameraInput.value = ''
    if (galleryInput) galleryInput.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.image || !formData.name.trim()) return

    setLoading(true)
    setUploadProgress(0)
    setUploadStatus('uploading')
    setRetryAttempt(0)
    
    try {
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.')
      }

      setUploadProgress(10)
      
      // Check for rapid uploads and show rate limiting message
      const now = Date.now()
      const timeSincePageLoad = now - (window as any).pageLoadTime || 0
      if (timeSincePageLoad < 10000) { // If uploading within 10 seconds of page load
        setUploadStatus('rate-limiting')
        setUploadProgress(20)
      }
      
      // Upload image with retry logic
      const { path, url } = await clothingService.uploadImage(formData.image)
      
      setUploadProgress(70)
      setUploadStatus('saving')

      // Save item to database
      const newItem = await clothingService.addItem({
        name: formData.name.trim(),
        description: formData.description.trim(),
        image_url: url,
        image_path: path
      })

      setUploadProgress(90)
      
      // Set matches if any were selected
      if (selectedMatchIds.length > 0) {
        await clothingService.setMatches(newItem.id, selectedMatchIds)
      }

      setUploadProgress(100)
      setUploadStatus('success')
      
      // Brief delay to show success state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/')
    } catch (error) {
      console.error('Error adding item:', error)
      
      let errorMessage = 'Error adding item. Please try again.'
      
      if (error instanceof Error) {
        errorMessage = error.message
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          fileName: formData.image?.name,
          fileSize: formData.image?.size,
          networkStatus: navigator.onLine ? 'online' : 'offline'
        })
      }
      
      // Show user-friendly error message
      alert(errorMessage)
    } finally {
      setLoading(false)
      setUploadProgress(0)
      setUploadStatus('idle')
      setRetryAttempt(0)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/"
                className="mr-4 text-gray-800 hover:text-gray-900 transition-colors"
              >
                ← Back
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Add New Item</h1>
            </div>
            
            {/* Network Status Indicator */}
            <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full ${
              isOnline 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
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
                  {/* Camera Input */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                    id="camera-upload"
                    required
                  />
                  {/* Gallery Input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="gallery-upload"
                    required
                  />
                  
                  <div className="text-gray-400 text-6xl mb-4">📷</div>
                  <p className="text-gray-800 text-lg mb-4">Add a photo of your clothing item</p>
                  
                  <div className="flex gap-3 justify-center">
                    <label 
                      htmlFor="camera-upload"
                      className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      📷 Take Photo
                    </label>
                    <label 
                      htmlFor="gallery-upload"
                      className="cursor-pointer bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      🖼️ Choose from Gallery
                    </label>
                  </div>
                  
                  <p className="text-gray-700 text-sm mt-3">JPG, PNG, or GIF up to 10MB</p>
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

          {/* Matching Items Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-900">
                Goes With (optional)
              </label>
              <button
                type="button"
                onClick={() => setShowMatches(!showMatches)}
                className="text-blue-500 hover:text-blue-600 text-sm transition-colors"
              >
                {showMatches ? 'Hide' : 'Select items'}
              </button>
            </div>
            
            {selectedMatchIds.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {selectedMatchIds.length} matching item{selectedMatchIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
            
            {showMatches && (
              <div className="border border-gray-300 rounded-lg p-4">
                <ItemSelector
                  selectedIds={selectedMatchIds}
                  onSelectionChange={setSelectedMatchIds}
                />
              </div>
            )}
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
                {uploadStatus === 'rate-limiting' && '⏳ Preventing throttling...'}
                {uploadStatus === 'retrying' && `🔄 Retrying (${retryAttempt}/3)...`}
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
                  {uploadStatus === 'rate-limiting' && 'Adding delay to prevent rate limiting...'}
                  {uploadStatus === 'retrying' && `Retrying upload (attempt ${retryAttempt}/3)...`}
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