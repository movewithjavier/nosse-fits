import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

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

  // Compress image for faster upload
  async compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      // Check if browser supports canvas and required APIs
      if (!HTMLCanvasElement.prototype.toBlob || !window.FileReader) {
        reject(new Error('Browser does not support required APIs for compression'))
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      const img = new Image()
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create a more compatible filename
                const timestamp = Date.now()
                const extension = file.name.split('.').pop() || 'jpg'
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                
                const compressedFile = new File([blob], `${timestamp}_${cleanName}`, {
                  type: 'image/jpeg',
                  lastModified: timestamp
                })
                resolve(compressedFile)
              } else {
                reject(new Error('Canvas toBlob returned null'))
              }
            },
            'image/jpeg',
            quality
          )
        } catch (error) {
          reject(new Error(`Canvas operations failed: ${error}`))
        }
      }
      
      img.onerror = (error) => {
        reject(new Error(`Failed to load image: ${error}`))
      }
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        reject(new Error('Image compression timeout'))
      }, 30000) // 30 second timeout
      
      try {
        img.src = URL.createObjectURL(file)
      } catch (error) {
        reject(new Error(`Failed to create object URL: ${error}`))
      }
    })
  },

  // Upload image to storage with retry logic
  async uploadImage(file: File, maxRetries = 3): Promise<{ path: string; url: string }> {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error(`File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum size is 10MB.`)
    }

    let fileToUpload: File
    
    try {
      // Try to compress image for faster upload
      fileToUpload = await this.compressImage(file)
      console.log(`Image compressed from ${Math.round(file.size / 1024)}KB to ${Math.round(fileToUpload.size / 1024)}KB`)
    } catch (compressionError) {
      console.warn('Image compression failed, uploading original:', compressionError)
      // Fall back to original file if compression fails
      fileToUpload = file
    }
    
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxRetries} for file: ${fileName}`)
        
        const { data, error } = await supabase.storage
          .from('clothing-images')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error(`Upload attempt ${attempt} failed:`, error)
          
          // Check if it's a retryable error
          const isRetryable = this.isRetryableError(error)
          
          if (!isRetryable || attempt === maxRetries) {
            throw new Error(`Upload failed: ${this.getReadableErrorMessage(error)}`)
          }
          
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Max 10 seconds
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        // Success! Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('clothing-images')
          .getPublicUrl(fileName)

        console.log(`Upload successful on attempt ${attempt}`)
        return { path: fileName, url: publicUrl }
        
      } catch (uploadError) {
        console.error(`Upload attempt ${attempt} error:`, uploadError)
        
        if (attempt === maxRetries) {
          throw uploadError
        }
        
        // Wait before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new Error('Upload failed after all retry attempts')
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