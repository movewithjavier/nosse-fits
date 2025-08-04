'use client'

import { ClothingItem, clothingService } from '@/lib/supabase'
import ItemCard from './ItemCard'

interface ItemGridProps {
  items: ClothingItem[]
  onUpdate: () => void
}

export default function ItemGrid({ items, onUpdate }: ItemGridProps) {
  const handleDelete = async (id: string) => {
    try {
      // Find the item to get the image path
      const item = items.find(item => item.id === id)
      if (item) {
        // Delete image from storage
        await clothingService.deleteImage(item.image_path)
        // Delete item from database
        await clothingService.deleteItem(id)
        // Refresh the items list
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item. Please try again.')
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">👕</div>
        <p className="text-gray-500 text-lg mb-2">No clothing items yet</p>
        <p className="text-gray-400 text-sm">Add your first item to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}