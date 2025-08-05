import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Create a fresh client for uploads to prevent connection state issues
export const createFreshSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseKey)
}

export interface ClothingItem {
  id: string
  created_at: string
  updated_at: string
  name: string
  description?: string
  image_url: string
  image_path: string
}

export interface ClothingItemInput {
  name: string
  description?: string
  image_url: string
  image_path: string
}

export interface ItemMatch {
  id: string
  created_at: string
  item_id: string
  matches_with_id: string
}

export interface MatchingItem {
  id: string
  name: string
  image_url: string
  description?: string
}

// Helper functions for clothing items
export const clothingService = {
  // Get all clothing items (personal use - no user filtering)
  async getItems(): Promise<ClothingItem[]> {
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Add new clothing item
  async addItem(itemData: ClothingItemInput): Promise<ClothingItem> {
    const { data, error } = await supabase
      .from('clothing_items')
      .insert([itemData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update existing clothing item
  async updateItem(id: string, itemData: Partial<ClothingItemInput>): Promise<ClothingItem> {
    const { data, error } = await supabase
      .from('clothing_items')
      .update({ ...itemData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete clothing item
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('clothing_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Compress image for faster upload with proper cleanup
  async compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      console.log(`🖼️ Starting image compression for: ${file.name} (${Math.round(file.size / 1024)}KB)`)
      
      // Check if browser supports canvas and required APIs
      if (!HTMLCanvasElement.prototype.toBlob || !window.FileReader) {
        console.warn('❌ Browser does not support required APIs for compression')
        reject(new Error('Browser does not support required APIs for compression'))
        return
      }

      let canvas: HTMLCanvasElement | null = null
      let ctx: CanvasRenderingContext2D | null = null
      let img: HTMLImageElement | null = null
      let objectUrl: string | null = null
      let timeoutId: number | null = null

      const cleanup = () => {
        try {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl)
            objectUrl = null
          }
          if (img) {
            img.onload = null
            img.onerror = null
            img.src = ''
            img = null
          }
          if (canvas) {
            canvas.width = 0
            canvas.height = 0
            canvas = null
          }
          if (ctx) {
            ctx = null
          }
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          console.log('🧹 Image compression cleanup completed')
        } catch (cleanupError) {
          console.warn('⚠️ Cleanup error:', cleanupError)
        }
      }

      try {
        canvas = document.createElement('canvas')
        ctx = canvas.getContext('2d', { alpha: false }) // Disable alpha for better performance
        
        if (!ctx) {
          cleanup()
          reject(new Error('Could not get canvas context'))
          return
        }

        img = new Image()
        img.crossOrigin = 'anonymous' // Prevent CORS issues
        
        img.onload = () => {
          try {
            console.log(`✅ Image loaded successfully: ${img!.width}x${img!.height}`)
            
            // Calculate new dimensions
            let { width, height } = img!
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
            
            canvas!.width = width
            canvas!.height = height
            
            console.log(`📐 Resizing to: ${width}x${height}`)
            
            // Clear canvas and draw image
            ctx!.clearRect(0, 0, width, height)
            ctx!.drawImage(img!, 0, 0, width, height)
            
            console.log('🎨 Image drawn to canvas, creating blob...')
            
            canvas!.toBlob(
              (blob) => {
                try {
                  if (blob) {
                    // Generate unique filename with random component to avoid conflicts
                    const timestamp = Date.now()
                    const random = Math.random().toString(36).substring(2, 8)
                    const extension = file.name.split('.').pop() || 'jpg'
                    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
                    
                    const fileName = `${timestamp}_${random}_${baseName}.jpg`
                    
                    const compressedFile = new File([blob], fileName, {
                      type: 'image/jpeg',
                      lastModified: timestamp
                    })
                    
                    console.log(`✅ Compression successful: ${Math.round(compressedFile.size / 1024)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`)
                    cleanup()
                    resolve(compressedFile)
                  } else {
                    console.error('❌ Canvas toBlob returned null')
                    cleanup()
                    reject(new Error('Canvas toBlob returned null - browser may have privacy restrictions'))
                  }
                } catch (blobError) {
                  console.error('❌ Blob creation error:', blobError)
                  cleanup()
                  reject(new Error(`Blob creation failed: ${blobError}`))
                }
              },
              'image/jpeg',
              quality
            )
          } catch (drawError) {
            console.error('❌ Canvas draw error:', drawError)
            cleanup()
            reject(new Error(`Canvas operations failed: ${drawError}`))
          }
        }
        
        img.onerror = (error) => {
          console.error('❌ Image load error:', error)
          cleanup()
          reject(new Error(`Failed to load image: ${error}`))
        }
        
        // Add timeout to prevent hanging
        timeoutId = window.setTimeout(() => {
          console.error('❌ Image compression timeout')
          cleanup()
          reject(new Error('Image compression timeout'))
        }, 30000) // 30 second timeout
        
        // Create object URL and load image
        objectUrl = URL.createObjectURL(file)
        img.src = objectUrl
        
      } catch (error) {
        console.error('❌ Image compression setup error:', error)
        cleanup()
        reject(new Error(`Failed to setup image compression: ${error}`))
      }
    })
  },

  // Upload image to storage with retry logic and enhanced error handling
  async uploadImage(file: File, maxRetries = 3): Promise<{ path: string; url: string }> {
    const uploadId = Math.random().toString(36).substring(2, 8)
    console.log(`🚀 [${uploadId}] Starting upload process for: ${file.name}`)
    
    // Detect browser for compatibility
    const userAgent = navigator.userAgent.toLowerCase()
    const isDuckDuckGo = userAgent.includes('ddg') || userAgent.includes('duckduckgo')
    const isPrivacyFocused = isDuckDuckGo || userAgent.includes('tor') || userAgent.includes('brave')
    
    console.log(`🕵️ [${uploadId}] Browser detection:`, {
      userAgent,
      isDuckDuckGo,
      isPrivacyFocused,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled
    })
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      const errorMsg = `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum size is 10MB.`
      console.error(`❌ [${uploadId}] ${errorMsg}`)
      throw new Error(errorMsg)
    }

    console.log(`📊 [${uploadId}] File details:`, {
      name: file.name,
      size: `${Math.round(file.size / 1024)}KB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    })

    let fileToUpload: File
    
    try {
      console.log(`🔄 [${uploadId}] Attempting image compression...`)
      // Try to compress image for faster upload
      fileToUpload = await this.compressImage(file)
      console.log(`✅ [${uploadId}] Compression successful: ${Math.round(file.size / 1024)}KB → ${Math.round(fileToUpload.size / 1024)}KB`)
    } catch (compressionError) {
      console.warn(`⚠️ [${uploadId}] Image compression failed, using original:`, compressionError)
      // Fall back to original file if compression fails
      fileToUpload = file
    }
    
    // Generate unique filename with multiple entropy sources
    const timestamp = Date.now()
    const random1 = Math.random().toString(36).substring(2, 8)
    const random2 = Math.random().toString(36).substring(2, 8)
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15)
    const fileName = `${timestamp}_${random1}_${random2}_${baseName}.jpg`
    
    console.log(`📝 [${uploadId}] Generated filename: ${fileName}`)
    
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔁 [${uploadId}] Upload attempt ${attempt}/${maxRetries}`)
        
        // Create fresh Supabase client for each attempt to prevent connection state issues
        const uploadClient = createFreshSupabaseClient()
        console.log(`🔄 [${uploadId}] Created fresh Supabase client`)
        
        // Test Supabase connection before upload
        try {
          const { data: testData, error: testError } = await uploadClient.storage.from('clothing-images').list('', { limit: 1 })
          if (testError) {
            console.warn(`⚠️ [${uploadId}] Supabase connection test failed:`, testError)
          } else {
            console.log(`✅ [${uploadId}] Supabase connection verified`)
          }
        } catch (testError) {
          console.warn(`⚠️ [${uploadId}] Supabase connection test error:`, testError)
        }
        
        // Add cache-busting and DuckDuckGo-friendly headers
        const uploadOptions: any = {
          cacheControl: 'no-cache, no-store, must-revalidate', // Strong cache-busting
          upsert: false,
          contentType: 'image/jpeg'
        }
        
        // Skip potentially problematic options for privacy browsers
        if (!isPrivacyFocused) {
          uploadOptions.duplex = 'half'
        }
        
        console.log(`📤 [${uploadId}] Starting Supabase upload with options:`, uploadOptions)
        
        const uploadStartTime = Date.now()
        const { data, error } = await uploadClient.storage
          .from('clothing-images')
          .upload(fileName, fileToUpload, uploadOptions)
        
        const uploadDuration = Date.now() - uploadStartTime
        console.log(`⏱️ [${uploadId}] Upload attempt ${attempt} took ${uploadDuration}ms`)

        if (error) {
          console.error(`❌ [${uploadId}] Upload attempt ${attempt} failed:`, {
            error,
            errorMessage: error.message,
            duration: uploadDuration
          })
          
          // Check if it's a retryable error
          const isRetryable = this.isRetryableError(error)
          console.log(`🔍 [${uploadId}] Error is ${isRetryable ? 'retryable' : 'not retryable'}`)
          
          if (!isRetryable || attempt === maxRetries) {
            const finalError = `Upload failed: ${this.getReadableErrorMessage(error)}`
            console.error(`💥 [${uploadId}] Final error: ${finalError}`)
            throw new Error(finalError)
          }
          
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Max 10 seconds
          console.log(`⏳ [${uploadId}] Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        console.log(`✅ [${uploadId}] Upload successful!`, { data, duration: uploadDuration })
        
        // Get the public URL using the same client
        console.log(`🔗 [${uploadId}] Getting public URL...`)
        const { data: { publicUrl } } = uploadClient.storage
          .from('clothing-images')
          .getPublicUrl(fileName)

        console.log(`🎉 [${uploadId}] Upload complete! URL: ${publicUrl}`)
        return { path: fileName, url: publicUrl }
        
      } catch (uploadError) {
        console.error(`💥 [${uploadId}] Upload attempt ${attempt} error:`, {
          error: uploadError,
          message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          stack: uploadError instanceof Error ? uploadError.stack : undefined
        })
        
        if (attempt === maxRetries) {
          console.error(`🚫 [${uploadId}] All attempts exhausted, throwing error`)
          throw uploadError
        }
        
        // Wait before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        console.log(`⏳ [${uploadId}] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    const finalError = 'Upload failed after all retry attempts'
    console.error(`🚫 [${uploadId}] ${finalError}`)
    throw new Error(finalError)
  },

  // Check if an error is retryable
  isRetryableError(error: any): boolean {
    const retryableMessages = [
      'failed to fetch',
      'network error',
      'timeout',
      'connection',
      'fetch',
      'NetworkError',
      'TypeError'
    ]
    
    const errorMessage = error?.message?.toLowerCase() || ''
    return retryableMessages.some(msg => errorMessage.includes(msg))
  },

  // Get user-friendly error message
  getReadableErrorMessage(error: any): string {
    const errorMessage = error?.message?.toLowerCase() || ''
    
    if (errorMessage.includes('failed to fetch') || errorMessage.includes('network')) {
      return 'Network connection issue. Please check your internet connection and try again.'
    }
    
    if (errorMessage.includes('timeout')) {
      return 'Upload timed out. Please try again with a smaller image or better connection.'
    }
    
    if (errorMessage.includes('storage')) {
      return 'Storage service temporarily unavailable. Please try again in a moment.'
    }
    
    return error?.message || 'Unknown upload error'
  },

  // Delete image from storage
  async deleteImage(imagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('clothing-images')
      .remove([imagePath])

    if (error) throw error
  },

  // Get items that match with a specific item
  async getMatchingItems(itemId: string): Promise<MatchingItem[]> {
    const { data, error } = await supabase
      .from('item_matches_view')
      .select('matches_with_id, matches_with_name, matches_with_image_url, matches_with_description')
      .eq('item_id', itemId)
    
    if (error) throw error
    
    return (data || []).map(item => ({
      id: item.matches_with_id,
      name: item.matches_with_name,
      image_url: item.matches_with_image_url,
      description: item.matches_with_description
    }))
  },

  // Add a match between two items (bidirectional)
  async addMatch(itemId: string, matchesWithId: string): Promise<void> {
    const { error } = await supabase
      .from('item_matches')
      .insert([{ item_id: itemId, matches_with_id: matchesWithId }])
    
    if (error) throw error
  },

  // Remove a match between two items (bidirectional)
  async removeMatch(itemId: string, matchesWithId: string): Promise<void> {
    const { error } = await supabase
      .from('item_matches')
      .delete()
      .eq('item_id', itemId)
      .eq('matches_with_id', matchesWithId)
    
    if (error) throw error
  },

  // Set all matches for an item (replaces existing matches)
  async setMatches(itemId: string, matchIds: string[]): Promise<void> {
    // Remove existing matches for this item
    await supabase
      .from('item_matches')
      .delete()
      .eq('item_id', itemId)
    
    // Add new matches
    if (matchIds.length > 0) {
      const matches = matchIds.map(matchId => ({
        item_id: itemId,
        matches_with_id: matchId
      }))
      
      const { error } = await supabase
        .from('item_matches')
        .insert(matches)
      
      if (error) throw error
    }
  }
}