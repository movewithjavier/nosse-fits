'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, clothingService, ClothingItem } from '@/lib/supabase'
import ItemGrid from '@/components/ItemGrid'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

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
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nosse Fits</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Manage your little one's wardrobe with ease
          </p>
          <p className="text-sm text-gray-500 mb-4">
            v1.0 - Built for busy parents 👶
          </p>
          <div className="text-6xl mb-6">👕</div>
          <button 
            onClick={signIn}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors w-full"
          >
            Sign In to Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Nosse Fits</h1>
            <button 
              onClick={signOut} 
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {items.length === 0 ? 'Your Wardrobe' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </h2>
            {items.length > 0 && (
              <p className="text-gray-600 text-sm">
                Tap on an item to view or delete
              </p>
            )}
          </div>
          <Link 
            href="/add"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Add Item
          </Link>
        </div>

        <ItemGrid items={items} onUpdate={loadItems} />
      </main>

      {/* Floating Add Button for Mobile */}
      <Link 
        href="/add"
        className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors sm:hidden"
        aria-label="Add new item"
      >
        +
      </Link>
    </div>
  )
}