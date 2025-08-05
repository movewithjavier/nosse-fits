'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ClothingItem } from '@/lib/supabase'

interface ItemCardProps {
  item: ClothingItem
  onDelete?: (id: string) => void
}

export default function ItemCard({ item, onDelete }: ItemCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete && confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id)
    }
  }

  return (
    <Link href={`/item/${item.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative aspect-square">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
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
        </div>
      </div>
    </Link>
  )
}