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
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  },

  // Upload image to storage
  async uploadImage(file: File): Promise<{ path: string; url: string }> {
    // Compress image for faster upload
    const compressedFile = await this.compressImage(file)
    
    const fileName = `${Date.now()}.jpg`
    
    const { data, error } = await supabase.storage
      .from('clothing-images')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('clothing-images')
      .getPublicUrl(fileName)

    return { path: fileName, url: publicUrl }
  },

  // Delete image from storage
  async deleteImage(imagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('clothing-images')
      .remove([imagePath])

    if (error) throw error
  }
}