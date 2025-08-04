# Nosse Fits - Technical Implementation Guide

## Development Setup & Architecture

### Recommended Tech Stack

**Frontend Framework: Next.js 14+ with React**
- Built-in PWA support
- Excellent mobile performance
- Image optimization out of the box
- Easy deployment to Vercel

**Backend: Supabase**
- PostgreSQL database
- Real-time subscriptions
- Built-in authentication
- File storage with CDN
- Generous free tier

**Styling: Tailwind CSS**
- Mobile-first responsive design
- Consistent design system
- Small bundle size

### Project Structure
```
nosse-fits/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── AddItemForm.jsx  # Add clothing item form
│   ├── ItemGrid.jsx     # Inventory grid display
│   └── ItemCard.jsx     # Individual item card
├── pages/
│   ├── index.js         # Home/inventory page
│   ├── add.js           # Add item page
│   └── api/             # API routes (if needed)
├── lib/
│   ├── supabase.js      # Supabase client setup
│   └── utils.js         # Helper functions
├── public/
│   └── icons/           # PWA icons
├── styles/
│   └── globals.css      # Global styles
└── next.config.js       # Next.js configuration
```

## Supabase Setup

### 1. Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clothing_items table
CREATE TABLE clothing_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    image_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create indexes for better performance
CREATE INDEX idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_created_at ON clothing_items(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure users can only see their own items
CREATE POLICY "Users can view their own items" ON clothing_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" ON clothing_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" ON clothing_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" ON clothing_items
    FOR DELETE USING (auth.uid() = user_id);
```

### 2. Storage Setup

```sql
-- Create storage bucket for clothing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing-images', 'clothing-images', true);

-- Create storage policy
CREATE POLICY "Users can upload their own images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images" ON storage.objects
    FOR SELECT USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Frontend Implementation

### 1. Supabase Client Setup (`lib/supabase.js`)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper functions for clothing items
export const clothingService = {
  // Get all clothing items for current user
  async getItems() {
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Add new clothing item
  async addItem(itemData) {
    const { data, error } = await supabase
      .from('clothing_items')
      .insert([itemData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Upload image to storage
  async uploadImage(file, userId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('clothing-images')
      .upload(fileName, file)

    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('clothing-images')
      .getPublicUrl(fileName)

    return { path: fileName, url: publicUrl }
  }
}
```

### 2. Main Inventory Page (`pages/index.js`)

```javascript
import { useState, useEffect } from 'react'
import { supabase, clothingService } from '../lib/supabase'
import ItemGrid from '../components/ItemGrid'
import Link from 'next/link'

export default function Home() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      if (session?.user) {
        loadItems()
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          loadItems()
        } else {
          setItems([])
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadItems = async () => {
    try {
      const data = await clothingService.getItems()
      setItems(data)
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google', // or 'apple' for iOS users
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>
  }

  if (!user) {
    return <div className="flex flex-col justify-center items-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Nosse Fits</h1>
      <p className="text-gray-600 mb-6 text-center">
        Manage your little one's wardrobe with ease
      </p>
      <button 
        onClick={signIn}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg"
      >
        Sign In to Get Started
      </button>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Nosse Fits</h1>
          <button onClick={signOut} className="text-sm text-gray-600">
            Sign Out
          </button>
        </div>
      </header>

      <main className="p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-6">No clothing items yet</p>
            <Link 
              href="/add"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg"
            >
              Add Your First Item
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </h2>
              <Link 
                href="/add"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Add Item
              </Link>
            </div>
            <ItemGrid items={items} onUpdate={loadItems} />
          </>
        )}
      </main>
    </div>
  )
}
```

### 3. Add Item Page (`pages/add.js`)

```javascript
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase, clothingService } from '../lib/supabase'

export default function AddItem() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null
  })
  const [imagePreview, setImagePreview] = useState(null)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, image: file })
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.image || !formData.name.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Upload image
      const { path, url } = await clothingService.uploadImage(
        formData.image, 
        user.id
      )

      // Save item to database
      await clothingService.addItem({
        name: formData.name.trim(),
        description: formData.description.trim(),
        image_url: url,
        image_path: path,
        user_id: user.id
      })

      router.push('/')
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Error adding item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="mr-4 text-gray-600"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold">Add New Item</h1>
        </div>
      </header>

      <main className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Photo *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setFormData({ ...formData, image: null })
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8"
                  >
                    ×
                  </button>
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
                  />
                  <label 
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <div className="text-gray-400 text-4xl mb-2">📷</div>
                    <p className="text-gray-600">Tap to take photo or upload</p>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Blue striped shirt"
              maxLength={100}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg"
              required
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Size, brand, notes..."
              maxLength={500}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.image || !formData.name.trim()}
            className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-medium disabled:bg-gray-300"
          >
            {loading ? 'Saving...' : 'Save Item'}
          </button>
        </form>
      </main>
    </div>
  )
}
```

## PWA Configuration

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  // PWA configuration
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  }
}

module.exports = nextConfig
```

### `public/manifest.json`
```json
{
  "name": "Nosse Fits",
  "short_name": "Nosse Fits",
  "description": "Wardrobe management for families",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Deployment Checklist

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Deployment Steps
1. **Supabase Setup**
   - Create new Supabase project
   - Run database schema scripts
   - Configure storage policies
   - Enable authentication providers

2. **Vercel Deployment**
   - Connect GitHub repository
   - Add environment variables
   - Deploy with automatic HTTPS

3. **Testing**
   - Test image upload/display
   - Verify responsive design on target devices
   - Test authentication flow
   - Performance audit with Lighthouse

### Performance Optimizations
- Image optimization through Next.js
- Lazy loading for item grid
- Service worker for offline capability
- Compressed image uploads
- Database query optimization

---

This technical guide provides everything needed to build and deploy the Nosse Fits MVP. The architecture is designed to be simple, scalable, and maintainable.