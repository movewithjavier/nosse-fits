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
  user_id: string
}

export interface ClothingItemInput {
  name: string
  description?: string
  image_url: string
  image_path: string
  user_id: string
}

// Helper functions for clothing items
export const clothingService = {
  // Get all clothing items (personal use - no user filtering)
  async getItems(): Promise<ClothingItem[]> {
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', 'personal-user')
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

  // Upload image to storage
  async uploadImage(file: File, userId: string): Promise<{ path: string; url: string }> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('clothing-images')
      .upload(fileName, file, {
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