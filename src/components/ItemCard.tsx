'use client'

import Image from 'next/image'
import { ClothingItem } from '@/lib/supabase'

interface ItemCardProps {
  item: ClothingItem
  onDelete?: (id: string) => void
}

export default function ItemCard({ item, onDelete }: ItemCardProps) {
  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative aspect-square">
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
            aria-label="Delete item"
          >
            ×
          </button>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs text-gray-800 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="text-xs text-gray-700 mt-2">
          {new Date(item.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}