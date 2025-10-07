import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useTranslation } from 'react-i18next'
import { CircleData } from '../lib/interaction-calculator'

interface D3TwitterCircleProps {
  data: CircleData
  width?: number
  height?: number
}

interface CircleNode {
  id: string
  username: string
  displayName: string
  avatar: string
  weight: number
  verified: boolean
  interactions: {
    replies: number
    likes: number
  }
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  layer: 'core' | 'inner' | 'outer'
  angle?: number
  radius?: number
}

const D3TwitterCircle: React.FC<D3TwitterCircleProps> = ({ data, width = 600, height = 600 }) => {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    content: string
  }>({ visible: false, x: 0, y: 0, content: '' })

  useEffect(() => {
    if (!svgRef.current || !data.users.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Set up canvas
    const centerX = width / 2
    const centerY = height / 2

    // Calculate scaling ratio based on canvas size
    const baseSize = 600 // Base size
    const scale = Math.min(width, height) / baseSize
    const minScale = 0.5 // Minimum scale ratio to avoid being too small
    const maxScale = 1.2 // Maximum scale ratio to avoid being too large
    const finalScale = Math.min(Math.max(scale, minScale), maxScale)

    // Divide users into layers intelligently to ensure complete circles
    const sortedUsers = [...data.users].sort((a, b) => b.weight - a.weight)

    // Define minimum users required for each complete circle
    const minCoreUsers = 6 // Minimum users for core circle
    const minInnerUsers = 12 // Minimum users for inner circle
    const minOuterUsers = 18 // Minimum users for outer circle

    let coreUsers: any[] = []
    let innerUsers: any[] = []
    let outerUsers: any[] = []

    // Smart layer distribution to ensure complete circles
    if (sortedUsers.length >= minCoreUsers + minInnerUsers + minOuterUsers) {
      // Enough users for 3 complete circles
      const coreCount = Math.min(8, Math.floor(sortedUsers.length * 0.15)) // 15% for core
      const innerCount = Math.min(16, Math.floor(sortedUsers.length * 0.35)) // 35% for inner
      const outerCount = Math.min(24, sortedUsers.length - coreCount - innerCount) // Rest for outer

      coreUsers = sortedUsers.slice(0, Math.max(coreCount, minCoreUsers))
      innerUsers = sortedUsers.slice(coreUsers.length, coreUsers.length + Math.max(innerCount, minInnerUsers))
      outerUsers = sortedUsers.slice(
        coreUsers.length + innerUsers.length,
        coreUsers.length + innerUsers.length + Math.max(outerCount, minOuterUsers),
      )
    } else if (sortedUsers.length >= minCoreUsers + minInnerUsers) {
      // Enough users for 2 complete circles - distribute between core and inner
      const coreCount = Math.min(10, Math.floor(sortedUsers.length * 0.4)) // 40% for core
      const innerCount = sortedUsers.length - coreCount // Rest for inner

      coreUsers = sortedUsers.slice(0, Math.max(coreCount, minCoreUsers))
      innerUsers = sortedUsers.slice(coreUsers.length, coreUsers.length + Math.max(innerCount, minInnerUsers))
      outerUsers = [] // No outer circle
    } else if (sortedUsers.length >= minCoreUsers) {
      // Only enough users for 1 complete circle - all go to core
      coreUsers = sortedUsers.slice(0, Math.min(sortedUsers.length, 20)) // Max 20 users in single circle
      innerUsers = []
      outerUsers = []
    } else {
      // Very few users - still put them in core circle but reduce minimum requirement
      coreUsers = sortedUsers.slice(0, Math.min(sortedUsers.length, 12)) // Even fewer users, still make a circle
      innerUsers = []
      outerUsers = []
    }

    // Define circle radii - adaptive to screen size for better space utilization
    const maxRadius = Math.min(width, height) * 0.45 // Outermost circle radius, occupying 45% of canvas
    const outerRadius = maxRadius
    const innerRadius = maxRadius * 0.75 // Inner circle radius
    const coreRadius = maxRadius * 0.45 // Core circle radius, increased to avoid overlap

    // Create node data
    const createNodes = (): CircleNode[] => {
      const nodes: CircleNode[] = []

      // Core circle nodes
      coreUsers.forEach((user, index) => {
        const angle = (index / coreUsers.length) * 2 * Math.PI
        nodes.push({
          id: user.user.id,
          username: user.user.username,
          displayName: user.user.displayName,
          avatar: user.user.avatar,
          weight: user.weight,
          verified: user.user.verified,
          interactions: {
            replies: user.interactions.replies,
            likes: user.interactions.likes,
          },
          layer: 'core',
          angle,
          radius: coreRadius,
          x: centerX + Math.cos(angle) * coreRadius,
          y: centerY + Math.sin(angle) * coreRadius,
        })
      })

      // Inner circle nodes
      innerUsers.forEach((user, index) => {
        const angle = (index / innerUsers.length) * 2 * Math.PI
        nodes.push({
          id: user.user.id,
          username: user.user.username,
          displayName: user.user.displayName,
          avatar: user.user.avatar,
          weight: user.weight,
          verified: user.user.verified,
          interactions: {
            replies: user.interactions.replies,
            likes: user.interactions.likes,
          },
          layer: 'inner',
          angle,
          radius: innerRadius,
          x: centerX + Math.cos(angle) * innerRadius,
          y: centerY + Math.sin(angle) * innerRadius,
        })
      })

      // Outer circle nodes
      outerUsers.forEach((user, index) => {
        const angle = (index / outerUsers.length) * 2 * Math.PI
        nodes.push({
          id: user.user.id,
          username: user.user.username,
          displayName: user.user.displayName,
          avatar: user.user.avatar,
          weight: user.weight,
          verified: user.user.verified,
          interactions: {
            replies: user.interactions.replies,
            likes: user.interactions.likes,
          },
          layer: 'outer',
          angle,
          radius: outerRadius,
          x: centerX + Math.cos(angle) * outerRadius,
          y: centerY + Math.sin(angle) * outerRadius,
        })
      })

      return nodes
    }

    const nodes = createNodes()

    // Create color scale
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(['core', 'inner', 'outer'])
      .range(['#3b82f6', '#60a5fa', '#93c5fd']) // Blue gradient

    // Set avatar size based on layer, adaptive to screen size and layer radius
    const getNodeSize = (layer: 'core' | 'inner' | 'outer') => {
      // Dynamically calculate avatar size based on layer radius and user count
      let baseSize: number
      let userCount: number
      let radius: number

      switch (layer) {
        case 'core':
          baseSize = 36
          userCount = coreUsers.length
          radius = coreRadius
          break
        case 'inner':
          baseSize = 30
          userCount = innerUsers.length
          radius = innerRadius
          break
        case 'outer':
          baseSize = 24
          userCount = outerUsers.length
          radius = outerRadius
          break
      }

      // Calculate maximum spacing between adjacent avatars on circumference to avoid overlap
      const circumference = 2 * Math.PI * radius
      const maxSizeBySpacing = userCount > 0 ? (circumference / userCount) * 0.7 : baseSize // Leave 70% space for avatars

      // Take smaller value to avoid overlap, but ensure minimum size
      const calculatedSize = Math.min(baseSize * finalScale, maxSizeBySpacing)
      return Math.max(calculatedSize, baseSize * 0.5) // Minimum not less than 50%
    }

    // Create node group
    const nodeGroup = svg.append('g').attr('class', 'nodes')

    // Define gradients
    const defs = svg.append('defs')

    // Define gradient for current user
    const currentUserGradient = defs
      .append('radialGradient')
      .attr('id', 'current-user-gradient')
      .attr('cx', '30%')
      .attr('cy', '30%')
      .attr('r', '70%')

    currentUserGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', 0.3)

    currentUserGradient.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.8)

    nodes.forEach((node) => {
      const gradient = defs
        .append('radialGradient')
        .attr('id', `gradient-${node.id}`)
        .attr('cx', '30%')
        .attr('cy', '30%')
        .attr('r', '70%')

      gradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', 0.3)

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(node.layer))
        .attr('stop-opacity', 0.8)
    })

    // Add current user's avatar to center
    const currentUserGroup = svg.append('g').attr('class', 'current-user')

    // User avatar size - adaptive to core circle radius, maintaining proportional coordination
    const userAvatarSize = Math.max(coreRadius * 0.45, 35) // Based on 45% of core circle radius, minimum 35px

    // User avatar shadow
    currentUserGroup
      .append('circle')
      .attr('cx', centerX + 1)
      .attr('cy', centerY + 1)
      .attr('r', userAvatarSize)
      .attr('fill', '#000000')
      .attr('opacity', 0.15)

    // User avatar background circle
    currentUserGroup
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', userAvatarSize + 2)
      .attr('fill', 'url(#current-user-gradient)')

    // User avatar image clip path
    defs
      .append('clipPath')
      .attr('id', 'current-user-clip')
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', userAvatarSize - 2)

    // User avatar image
    currentUserGroup
      .append('image')
      .attr('href', data.currentUser.avatar)
      .attr('x', centerX - userAvatarSize + 2)
      .attr('y', centerY - userAvatarSize + 2)
      .attr('width', (userAvatarSize - 2) * 2)
      .attr('height', (userAvatarSize - 2) * 2)
      .attr('clip-path', 'url(#current-user-clip)')

    // Draw nodes (using pre-calculated positions)
    const nodeElements = nodeGroup
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')

    // Node shadow
    nodeElements
      .append('circle')
      .attr('r', (d) => getNodeSize(d.layer))
      .attr('fill', '#000000')
      .attr('opacity', 0.15)
      .attr('transform', 'translate(1, 1)')

    // Node body
    nodeElements
      .append('circle')
      .attr('r', (d) => getNodeSize(d.layer))
      .attr('fill', (d) => `url(#gradient-${d.id})`)

    // Avatar images
    nodeElements
      .append('clipPath')
      .attr('id', (d) => `clip-${d.id}`)
      .append('circle')
      .attr('r', (d) => getNodeSize(d.layer) - 2)

    nodeElements
      .append('image')
      .attr('href', (d) => d.avatar)
      .attr('x', (d) => -getNodeSize(d.layer) + 2)
      .attr('y', (d) => -getNodeSize(d.layer) + 2)
      .attr('width', (d) => (getNodeSize(d.layer) - 2) * 2)
      .attr('height', (d) => (getNodeSize(d.layer) - 2) * 2)
      .attr('clip-path', (d) => `url(#clip-${d.id})`)

    // Add hover interactions
    nodeElements
      .on('mouseover', function (event, d) {
        // Highlight effect
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('filter', 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))')
          .attr('transform', 'scale(1.1)')

        // Show tooltip - fix position relative to SVG container
        const svgRect = svgRef.current!.getBoundingClientRect()
        const [mouseX, mouseY] = d3.pointer(event, svgRef.current!)
        setTooltip({
          visible: true,
          x: svgRect.left + mouseX + 10,
          y: svgRect.top + mouseY - 10,
          content: `@${d.username}\n${t('interactionCircle.visualisation.tooltip.replies')}: ${d.interactions.replies} | ${t('interactionCircle.visualisation.tooltip.likes')}: ${d.interactions.likes}`,
        })
      })
      .on('mouseout', function () {
        // Remove highlight
        d3.select(this).select('circle').transition().duration(200).attr('filter', null).attr('transform', 'scale(1)')

        setTooltip((prev) => ({ ...prev, visible: false }))
      })
      .on('click', (_, d) => {
        window.open(`https://twitter.com/${d.username}`, '_blank')
      })
  }, [data, width, height, t])

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-gradient-to-br from-slate-50 to-blue-50"
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-pre-line"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  )
}

export default D3TwitterCircle
