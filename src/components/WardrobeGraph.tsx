'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  BackgroundVariant,
  NodeTypes
} from 'reactflow'
import 'reactflow/dist/style.css'

import { ClothingItem, clothingService } from '@/lib/supabase'
import ClothingNode from './ClothingNode'

interface WardrobeGraphProps {
  items: ClothingItem[]
}

// Register custom node types
const nodeTypes: NodeTypes = {
  clothing: ClothingNode,
}

export default function WardrobeGraph({ items }: WardrobeGraphProps) {
  const router = useRouter()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  // Transform items and matches into graph data
  const buildGraphData = useCallback(async () => {
    if (items.length === 0) return

    try {
      setLoading(true)
      
      // Get all matches for all items
      const allMatches = await Promise.all(
        items.map(async (item) => {
          const matches = await clothingService.getMatchingItems(item.id)
          return { itemId: item.id, matches }
        })
      )

      // Create nodes from items with more organic spacing
      const graphNodes: Node[] = items.map((item, index) => {
        // More natural circular/organic layout
        const centerX = 400
        const centerY = 300
        const radius = Math.max(150, items.length * 15)
        const angle = (index / items.length) * 2 * Math.PI
        
        // Add some randomness for more organic feel
        const randomX = (Math.random() - 0.5) * 100
        const randomY = (Math.random() - 0.5) * 100
        
        return {
          id: item.id,
          type: 'clothing',
          position: {
            x: centerX + Math.cos(angle) * radius + randomX,
            y: centerY + Math.sin(angle) * radius + randomY
          },
          data: {
            item,
            onClick: () => router.push(`/item/${item.id}`)
          },
          draggable: true
        }
      })

      // Create edges from matches
      const graphEdges: Edge[] = []
      const processedPairs = new Set<string>()

      allMatches.forEach(({ itemId, matches }) => {
        matches.forEach((match) => {
          // Create a unique identifier for this pair (sorted to avoid duplicates)
          const pairId = [itemId, match.id].sort().join('-')
          
          if (!processedPairs.has(pairId)) {
            processedPairs.add(pairId)
            graphEdges.push({
              id: pairId,
              source: itemId,
              target: match.id,
              type: 'straight',
              style: {
                stroke: '#9333ea',
                strokeWidth: 1.5,
                strokeOpacity: 0.6,
              },
              animated: false
            })
          }
        })
      })

      setNodes(graphNodes)
      setEdges(graphEdges)

    } catch (error) {
      console.error('Error building graph data:', error)
    } finally {
      setLoading(false)
    }
  }, [items, router])

  useEffect(() => {
    buildGraphData()
  }, [buildGraphData])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-gray-600">Building network...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.5
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={40}
          size={0.5}
          color="#f3f4f6"
        />
        <Controls 
          position="bottom-right"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  )
}