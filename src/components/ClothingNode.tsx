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
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#6366f1',
          width: 8,
          height: 8,
          border: '2px solid white'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#6366f1',
          width: 8,
          height: 8,
          border: '2px solid white'
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          background: '#6366f1',
          width: 8,
          height: 8,
          border: '2px solid white'
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ 
          background: '#6366f1',
          width: 8,
          height: 8,
          border: '2px solid white'
        }}
      />

      {/* Node content */}
      <div 
        onClick={onClick}
        className="relative w-24 h-24 bg-white rounded-lg shadow-lg border-2 border-gray-200 cursor-pointer transition-all hover:shadow-xl hover:border-blue-400 hover:scale-105"
      >
        {/* Item image */}
        <div className="w-full h-16 relative overflow-hidden rounded-t-md">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        
        {/* Item name */}
        <div className="p-1">
          <p className="text-xs font-medium text-gray-900 line-clamp-1 text-center">
            {item.name}
          </p>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 pointer-events-none" />
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