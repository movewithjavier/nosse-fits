'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Handle, Position, NodeProps } from 'reactflow'
import { ClothingItem } from '@/lib/supabase'

interface ClothingNodeData {
  item: ClothingItem
  onClick: () => void
}

const ClothingNode = memo(({ data }: NodeProps<ClothingNodeData>) => {
  const { item, onClick } = data

  return (
    <div className="group">
      {/* Connection handles - minimal and hidden */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: 'transparent',
          border: 'none',
          width: 6,
          height: 6,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: 'transparent',
          border: 'none',
          width: 6,
          height: 6,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          background: 'transparent',
          border: 'none',
          width: 6,
          height: 6,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ 
          background: 'transparent',
          border: 'none',
          width: 6,
          height: 6,
        }}
      />

      {/* Node content - Circular like Obsidian */}
      <div 
        onClick={onClick}
        className="relative w-16 h-16 bg-white rounded-full shadow-md border-2 border-gray-300 cursor-pointer transition-all hover:shadow-lg hover:border-purple-400 hover:scale-110 overflow-hidden"
      >
        {/* Item image - fills the circle */}
        <div className="w-full h-full relative">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover rounded-full"
            sizes="64px"
          />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-purple-500 bg-opacity-0 group-hover:bg-opacity-15 rounded-full transition-all duration-200 pointer-events-none" />
      </div>

      {/* Node label (appears below on hover) */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-32">
          <p className="truncate">{item.name}</p>
          {item.description && (
            <p className="text-gray-300 truncate">{item.description}</p>
          )}
        </div>
      </div>
    </div>
  )
})

ClothingNode.displayName = 'ClothingNode'

export default ClothingNode