'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3'
import { ClothingItem, clothingService } from '@/lib/supabase'

interface Node extends d3.SimulationNodeDatum {
  id: string
  item: ClothingItem
  x?: number
  y?: number
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node
  target: string | Node
}

interface D3GraphViewProps {
  items: ClothingItem[]
}

export default function D3GraphView({ items }: D3GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!svgRef.current || items.length === 0) return

    const buildGraph = async () => {
      try {
        setLoading(true)

        // Get all matches for all items
        const allMatches = await Promise.all(
          items.map(async (item) => {
            const matches = await clothingService.getMatchingItems(item.id)
            return { itemId: item.id, matches }
          })
        )

        // Create nodes
        const nodes: Node[] = items.map(item => ({
          id: item.id,
          item
        }))

        // Create links
        const links: Link[] = []
        const processedPairs = new Set<string>()

        allMatches.forEach(({ itemId, matches }) => {
          matches.forEach((match) => {
            const pairId = [itemId, match.id].sort().join('-')
            if (!processedPairs.has(pairId)) {
              processedPairs.add(pairId)
              links.push({
                source: itemId,
                target: match.id
              })
            }
          })
        })

        // Set up D3 visualization
        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove() // Clear previous content

        const container = svg.select('.graph-container')
          .empty() ? svg.append('g').attr('class', 'graph-container') : svg.select('.graph-container')

        // Get container dimensions
        const rect = svgRef.current!.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        // Set up zoom behavior
        const zoom = d3.zoom()
          .scaleExtent([0.1, 3])
          .on('zoom', (event) => {
            container.attr('transform', event.transform)
          })

        svg.call(zoom as any)

        // Create force simulation
        const simulation = d3.forceSimulation<Node>(nodes)
          .force('link', d3.forceLink<Node, Link>(links).id((d) => d.id).distance(120))
          .force('charge', d3.forceManyBody().strength(-800))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(50))

        // Create link elements
        const link = (container as any).selectAll('line.link')
          .data(links)
          .enter()
          .append('line')
          .attr('class', 'link')
          .style('stroke', '#8b5cf6')
          .style('stroke-width', 2)
          .style('stroke-opacity', 0.8)

        // Create node groups
        const nodeGroup = (container as any).selectAll('g.node')
          .data(nodes)
          .enter()
          .append('g')
          .attr('class', 'node')
          .style('cursor', 'pointer')
          .call(d3.drag<SVGGElement, Node>()
            .on('start', (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart()
              d.fx = d.x
              d.fy = d.y
            })
            .on('drag', (event, d) => {
              d.fx = event.x
              d.fy = event.y
            })
            .on('end', (event, d) => {
              if (!event.active) simulation.alphaTarget(0)
              d.fx = null
              d.fy = null
            })
          )

        // Add circular background for nodes
        nodeGroup.append('circle')
          .attr('r', 35)
          .style('fill', '#ffffff')
          .style('stroke', '#6366f1')
          .style('stroke-width', 2)
          .style('filter', 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3))')

        // Add clothing images using foreignObject for better image handling
        nodeGroup.append('foreignObject')
          .attr('x', -30)
          .attr('y', -30)
          .attr('width', 60)
          .attr('height', 60)
          .append('xhtml:div')
          .style('width', '60px')
          .style('height', '60px')
          .style('border-radius', '50%')
          .style('overflow', 'hidden')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .style('background', '#f9fafb')
          .append('xhtml:img')
          .attr('src', (d: Node) => d.item.image_url)
          .attr('alt', (d: Node) => d.item.name)
          .style('width', '100%')
          .style('height', '100%')
          .style('object-fit', 'cover')

        // Add hover effects
        nodeGroup
          .on('mouseenter', function(this: SVGGElement, event: any, d: Node) {
            d3.select(this).select('circle')
              .transition()
              .duration(200)
              .style('stroke', '#a855f7')
              .style('stroke-width', 3)
              .attr('r', 38)
          })
          .on('mouseleave', function(this: SVGGElement, event: any, d: Node) {
            d3.select(this).select('circle')
              .transition()
              .duration(200)
              .style('stroke', '#6366f1')
              .style('stroke-width', 2)
              .attr('r', 35)
          })
          .on('click', (event: any, d: Node) => {
            router.push(`/item/${d.item.id}`)
          })

        // Add labels (shown on hover)
        const labels = nodeGroup.append('text')
          .attr('dy', 55)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', '600')
          .style('fill', '#e2e8f0')
          .style('opacity', 0)
          .style('pointer-events', 'none')
          .text((d: Node) => d.item.name.length > 15 ? d.item.name.substring(0, 15) + '...' : d.item.name)

        nodeGroup
          .on('mouseenter.label', function(this: SVGGElement) {
            d3.select(this).select('text')
              .transition()
              .duration(200)
              .style('opacity', 1)
          })
          .on('mouseleave.label', function(this: SVGGElement) {
            d3.select(this).select('text')
              .transition()
              .duration(200)
              .style('opacity', 0)
          })

        // Update positions on each tick
        simulation.on('tick', () => {
          link
            .attr('x1', (d: Link) => (d.source as Node).x!)
            .attr('y1', (d: Link) => (d.source as Node).y!)
            .attr('x2', (d: Link) => (d.target as Node).x!)
            .attr('y2', (d: Link) => (d.target as Node).y!)

          nodeGroup
            .attr('transform', (d: Node) => `translate(${d.x},${d.y})`)
        })

        // Initial zoom to fit content
        const bounds = (container.node() as SVGGElement)?.getBBox()
        if (bounds) {
          const fullWidth = bounds.width
          const fullHeight = bounds.height
          const widthScale = width / fullWidth
          const heightScale = height / fullHeight
          const scale = Math.min(widthScale, heightScale) * 0.8

          const centerX = bounds.x + fullWidth / 2
          const centerY = bounds.y + fullHeight / 2
          const translateX = width / 2 - centerX * scale
          const translateY = height / 2 - centerY * scale

          svg.transition()
            .duration(750)
            .call(zoom.transform as any, d3.zoomIdentity.translate(translateX, translateY).scale(scale))
        }

      } catch (error) {
        console.error('Error building D3 graph:', error)
      } finally {
        setLoading(false)
      }
    }

    buildGraph()
  }, [items, router])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-gray-600">Building network...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
          borderRadius: '8px'
        }}
      />
      
      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-purple-500/20 text-sm text-gray-300 max-w-xs">
        <p className="font-medium mb-1 text-purple-400">🎯 Interactive Network</p>
        <ul className="space-y-1 text-xs">
          <li>• Click nodes to view items</li>
          <li>• Drag to reposition</li>
          <li>• Scroll to zoom</li>
          <li>• Hover for item names</li>
        </ul>
      </div>
    </div>
  )
}