import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { CircleData, UserInteraction } from '../lib/interaction-calculator'
import { getCSSVariable } from '../lib/utils'

interface TwitterCircleVisualizerProps {
  data: CircleData
  width?: number
  height?: number
}

interface NodeData extends d3.SimulationNodeDatum {
  id: string
  user: UserInteraction
  radius: number
  color: string
}

const TwitterCircleVisualizer: React.FC<TwitterCircleVisualizerProps> = ({ data, width = 800, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    content: string
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  })

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // 清除之前的内容

    // 创建节点数据
    const nodes: NodeData[] = data.users.map((user) => {
      // 根据权重计算节点半径
      const maxWeight = Math.max(...data.users.map((u) => u.weight))
      const minRadius = 20
      const maxRadius = 60
      const radius = minRadius + (user.weight / maxWeight) * (maxRadius - minRadius)

      // 根据互动类型确定颜色
      let color = '#3B82F6' // 默认蓝色
      if (user.interactions.replies > user.interactions.likes) {
        color = '#EF4444' // 回复多的用红色
      } else if (user.interactions.quotes > 0) {
        color = '#10B981' // 有转发的用绿色
      } else if (user.interactions.likes > 10) {
        color = '#F59E0B' // 点赞多的用黄色
      }

      return {
        id: user.user.id,
        user,
        radius,
        color,
        x: Math.random() * width,
        y: Math.random() * height,
      }
    })

    // 创建力导向模拟
    const simulation = d3
      .forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d) => (d as NodeData).radius + 5),
      )
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1))

    // 创建容器组
    const container = svg.append('g')

    // 添加缩放功能
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom)

    // 创建渐变定义
    const defs = svg.append('defs')
    nodes.forEach((node) => {
      const gradient = defs
        .append('radialGradient')
        .attr('id', `gradient-${node.id}`)
        .attr('cx', '30%')
        .attr('cy', '30%')
        .attr('r', '70%')

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.color(node.color)!.brighter(0.5).toString())
        .attr('stop-opacity', 0.8)

      gradient.append('stop').attr('offset', '100%').attr('stop-color', node.color).attr('stop-opacity', 1)
    })

    // 创建节点组
    const nodeGroups = container
      .selectAll('.node-group')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')

    // 添加外圈（选中状态）
    nodeGroups
      .append('circle')
      .attr('class', 'selection-ring')
      .attr('r', (d) => d.radius + 3)
      .attr('fill', 'none')
      .attr('stroke', '#3B82F6')
      .attr('stroke-width', 3)
      .attr('opacity', 0)

    // 添加主圆圈
    nodeGroups
      .append('circle')
      .attr('class', 'main-circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => `url(#gradient-${d.id})`)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)

    // 添加头像（如果有的话）
    nodeGroups
      .append('image')
      .attr('class', 'avatar')
      .attr('href', (d) => d.user.user.avatar)
      .attr('x', (d) => -d.radius * 0.7)
      .attr('y', (d) => -d.radius * 0.7)
      .attr('width', (d) => d.radius * 1.4)
      .attr('height', (d) => d.radius * 1.4)
      .attr('clip-path', (d) => `circle(${d.radius * 0.7}px at center)`)
      .style('opacity', 0.9)

    // 添加用户名标签
    nodeGroups
      .append('text')
      .attr('class', 'username-label')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 15)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .text((d) => `@${d.user.user.username}`)

    // 添加权重标签
    nodeGroups
      .append('text')
      .attr('class', 'weight-label')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 30)
      .attr('font-size', '10px')
      .attr('fill', '#6B7280')
      .text((d) => `权重: ${Math.round(d.user.weight)}`)

    // 添加交互事件
    nodeGroups
      .on('mouseover', function (event, d) {
        // 显示选中状态
        d3.select(this).select('.selection-ring').transition().duration(200).attr('opacity', 1)

        // 显示提示框
        const content = `
          <div class="font-bold">@${d.user.user.username}</div>
          <div class="text-sm text-gray-600 mt-1">${d.user.user.displayName}</div>
          <div class="mt-2 text-xs">
            <div>回复: ${d.user.interactions.replies}</div>
            <div>转发: ${d.user.interactions.quotes}</div>
            <div>点赞: ${d.user.interactions.likes}</div>
            <div class="font-semibold mt-1">权重: ${Math.round(d.user.weight)}</div>
          </div>
        `

        setTooltip({
          visible: true,
          x: event.pageX + 10,
          y: event.pageY - 10,
          content,
        })
      })
      .on('mouseout', function () {
        // 隐藏选中状态
        d3.select(this).select('.selection-ring').transition().duration(200).attr('opacity', 0)

        // 隐藏提示框
        setTooltip((prev) => ({ ...prev, visible: false }))
      })
      .on('click', function (_event, d) {
        setSelectedNode(d)
        // 可以在这里添加更多点击逻辑，比如跳转到Twitter页面
        window.open(`https://twitter.com/${d.user.user.username}`, '_blank')
      })

    // 添加拖拽功能
    const drag = d3
      .drag<SVGGElement, NodeData>()
      .on('start', function (event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', function (event, d) {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', function (event, d) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    nodeGroups.call(drag)

    // 更新节点位置
    simulation.on('tick', () => {
      nodeGroups.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    // 添加图例
    const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(20, 20)`)

    const legendData = [
      { color: '#EF4444', text: '回复较多' },
      { color: '#10B981', text: '有转发' },
      { color: '#F59E0B', text: '点赞较多' },
      { color: '#3B82F6', text: '普通互动' },
    ]

    const legendItems = legend
      .selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (_d, i) => `translate(0, ${i * 25})`)

    legendItems
      .append('circle')
      .attr('r', 8)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)

    legendItems
      .append('text')
      .attr('x', 20)
      .attr('y', 4)
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text((d) => d.text)

    // 清理函数
    return () => {
      simulation.stop()
    }
  }, [data, width, height])

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="border border-gray-200 rounded-lg bg-white" />

      {/* 自定义提示框 */}
      {tooltip.visible && (
        <div
          className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {/* 控制面板 */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3">
        <div className="text-sm font-medium text-gray-700 mb-2">控制</div>
        <div className="space-y-2">
          <button
            onClick={() => {
              const svg = d3.select(svgRef.current!)
              svg.transition().duration(750).call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity)
            }}
            className="block w-full text-left px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            重置视图
          </button>
          <div className="text-xs text-gray-500">
            拖拽: 移动节点
            <br />
            滚轮: 缩放视图
            <br />
            点击: 访问Twitter
          </div>
        </div>
      </div>

      {/* 选中用户详情 */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-4 max-w-xs">
          <div className="flex items-center space-x-3">
            <img
              src={selectedNode.user.user.avatar}
              alt={selectedNode.user.user.displayName}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <div className="font-bold">{selectedNode.user.user.displayName}</div>
              <div className="text-sm text-gray-600">@{selectedNode.user.user.username}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>回复: {selectedNode.user.interactions.replies}</div>
            <div>转发: {selectedNode.user.interactions.quotes}</div>
            <div>点赞: {selectedNode.user.interactions.likes}</div>
            <div className="font-semibold">权重: {Math.round(selectedNode.user.weight)}</div>
          </div>
          <button onClick={() => setSelectedNode(null)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
            关闭
          </button>
        </div>
      )}
    </div>
  )
}

export default TwitterCircleVisualizer
