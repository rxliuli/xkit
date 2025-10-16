import React, { useRef } from 'react'
import { CircleData } from '../lib/interaction-calculator'
import { getCSSVariable } from '../lib/utils'

interface SimpleTwitterCircleProps {
  data: CircleData
  onExportImage?: () => void
}

const SimpleTwitterCircle: React.FC<SimpleTwitterCircleProps> = ({ data, onExportImage }) => {
  const circleRef = useRef<HTMLDivElement>(null)

  // Divide users into three layers
  const sortedUsers = [...data.users].sort((a, b) => b.weight - a.weight)
  const totalUsers = sortedUsers.length

  // Core circle (top 20%)
  const coreUsers = sortedUsers.slice(0, Math.ceil(totalUsers * 0.2))
  // Inner circle (21%-60%)
  const innerUsers = sortedUsers.slice(Math.ceil(totalUsers * 0.2), Math.ceil(totalUsers * 0.6))
  // Outer circle (61%-100%)
  const outerUsers = sortedUsers.slice(Math.ceil(totalUsers * 0.6))

  const handleExportImage = async () => {
    if (!circleRef.current) return

    try {
      // Use html2canvas to export image
      const html2canvas = await import('html2canvas')
      const canvas = await html2canvas.default(circleRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // High resolution
        width: 800,
        height: 800,
      })

      // Create download link
      const link = document.createElement('a')
      link.download = `twitter-circle-${new Date().getTime()}.png`
      link.href = canvas.toDataURL()
      link.click()

      onExportImage?.()
    } catch (error) {
      console.error('Image export failed:', error)
      alert('Image export failed, please try again')
    }
  }

  const UserAvatar: React.FC<{
    user: (typeof sortedUsers)[0]
    size: number
    className?: string
    style?: React.CSSProperties
  }> = ({ user, size, className = '', style }) => (
    <div
      className={`relative group cursor-pointer ${className}`}
      style={style}
      title={`@${user.user.username} - Weight: ${Math.round(user.weight)}`}
      onClick={() => window.open(`https://twitter.com/${user.user.username}`, '_blank')}
    >
      <img
        src={user.user.avatar}
        alt={user.user.displayName}
        className={`rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110`}
        style={{ width: size, height: size }}
      />
      {user.user.verified && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
      {/* Hover to show user information */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
        <div className="font-bold">@{user.user.username}</div>
        <div>Weight: {Math.round(user.weight)}</div>
        <div>
          Replies: {user.interactions.replies} | Likes: {user.interactions.likes}
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Export button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExportImage}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export Image
        </button>
      </div>

      {/* Interaction circle */}
      <div
        ref={circleRef}
        className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8"
        style={{ width: 800, height: 800 }}
      >
        {/* Title */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">My Twitter Interaction Circle</h2>
          <p className="text-sm text-gray-600">
            Based on analysis of recent {data.totalReplies} replies and {data.totalLikes} likes
          </p>
        </div>

        {/* Three-layer circles */}
        <div className="absolute inset-8 flex items-center justify-center">
          {/* Outer circle - light blue */}
          <div
            className="absolute rounded-full border-2 border-blue-200 bg-blue-50/30"
            style={{ width: 650, height: 650 }}
          >
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <span className="text-xs font-medium text-blue-600 bg-white px-2 py-1 rounded">
                Outer Circle ({outerUsers.length} users)
              </span>
            </div>
          </div>

          {/* Inner circle - medium blue */}
          <div
            className="absolute rounded-full border-2 border-blue-300 bg-blue-100/50"
            style={{ width: 450, height: 450 }}
          >
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <span className="text-xs font-medium text-blue-700 bg-white px-2 py-1 rounded">
                Inner Circle ({innerUsers.length} users)
              </span>
            </div>
          </div>

          {/* Core circle - dark blue */}
          <div
            className="absolute rounded-full border-2 border-blue-500 bg-blue-200/60"
            style={{ width: 250, height: 250 }}
          >
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <span className="text-xs font-medium text-blue-800 bg-white px-2 py-1 rounded">
                Core Circle ({coreUsers.length} users)
              </span>
            </div>
          </div>

          {/* Place user avatars */}
          {/* Core circle users */}
          {coreUsers.map((user, index) => {
            const angle = (index / coreUsers.length) * 2 * Math.PI
            const radius = 80
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            return (
              <UserAvatar
                key={user.user.id}
                user={user}
                size={50}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              />
            )
          })}

          {/* Inner circle users */}
          {innerUsers.map((user, index) => {
            const angle = (index / innerUsers.length) * 2 * Math.PI
            const radius = 150
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            return (
              <UserAvatar
                key={user.user.id}
                user={user}
                size={40}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              />
            )
          })}

          {/* Outer circle users */}
          {outerUsers.map((user, index) => {
            const angle = (index / outerUsers.length) * 2 * Math.PI
            const radius = 250
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            return (
              <UserAvatar
                key={user.user.id}
                user={user}
                size={32}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-6">
          <div className="bg-white/90 rounded-lg p-3 text-xs">
            <div className="font-semibold text-gray-800 mb-2">Interaction Intensity</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600"></div>
                <span>Core Circle - High Frequency</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-300 border border-blue-400"></div>
                <span>Inner Circle - Medium Frequency</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200"></div>
                <span>Outer Circle - Low Frequency</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="absolute bottom-6 right-6">
          <div className="bg-white/90 rounded-lg p-3 text-xs">
            <div className="font-semibold text-gray-800 mb-2">Analysis Data</div>
            <div className="space-y-1">
              <div>Users Analyzed: {data.totalUsers}</div>
              <div>Replies: {data.totalReplies}</div>
              <div>Likes: {data.totalLikes}</div>
              <div>Analysis Date: {data.analysisDate}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleTwitterCircle
