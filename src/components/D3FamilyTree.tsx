import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useTranslation } from 'react-i18next'
import { FamilyTreeData, TreeNode } from '../lib/family-tree-calculator'

interface D3FamilyTreeProps {
  data: FamilyTreeData
  width: number
  height: number
}

const BACKGROUND_COLOR = '#f8fafc'
const NODE_COLORS: Record<TreeNode['type'] | 'default', string> = {
  root: '#8b5cf6',
  spouse: '#10b981',
  parent: '#3b82f6',
  child: '#ec4899',
  default: '#9ca3af',
}

const ROOT_RADIUS = 70
const NODE_RADIUS = 60
const TOP_MARGIN = 100
const BOTTOM_MARGIN = 100
const SECTION_LABEL_OFFSET = 28
const USERNAME_BASELINE_OFFSET = 18
const CONNECTOR_PADDING = 10
const VERTICAL_GAP = 120
const HORIZONTAL_SPACING_MIN = 180
const HORIZONTAL_SPACING_MAX = 260
const TEXT_PADDING_X = 8
const TEXT_PADDING_Y = 6
const SECTION_LABEL_PADDING_X = 12
const SECTION_LABEL_PADDING_Y = 6

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '')

const getRadius = (_type: TreeNode['type']) => NODE_RADIUS

export default function D3FamilyTree({ data, width, height }: D3FamilyTreeProps) {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const parentsLayer = data?.layers[0] || []
    const middleLayer = data?.layers[1] || []
    const childrenLayer = data?.layers[2] || []

    const rootNode = middleLayer.find((node) => node.type === 'root')
    if (!rootNode) {
      return
    }

    const spouseNode = middleLayer.find((node) => node.type === 'spouse')
    if (!spouseNode) {
      return
    }

    const centerX = width / 2
    let currentY = 50

    drawSectionLabel(t('familyTree.visualisation.labels.parents'), centerX, TOP_MARGIN)
    currentY += 22
    currentY += 100
    const [x1, x2] = [0, 1].map((index) => {
      const x = 150
      return parentsLayer.length >= 2 ? centerX - x + index * x * 2 : centerX
    })
    drawUser(parentsLayer[0], x1, currentY)
    drawUser(parentsLayer[1], x2, currentY)
    currentY += 85
    drawVerticalLine(x1, currentY, currentY + 20)
    drawVerticalLine(x2, currentY, currentY + 20)
    currentY += 20
    drawHorizontalLine(x1, x2, currentY)
    drawVerticalLine(centerX, currentY, currentY + 40)
    currentY += 40
    drawHorizontalLine(x1, centerX, currentY)
    drawVerticalLine(x1, currentY, currentY + 20)
    drawSectionLabel(t('familyTree.visualisation.labels.spouse'), x2, currentY)
    currentY += 80
    drawUser(rootNode, x1, currentY)
    drawUser(spouseNode, x2, currentY)
    currentY += 85
    drawVerticalLine(x1, currentY, currentY + 20)
    drawVerticalLine(x2, currentY, currentY + 20)
    currentY += 20
    drawHorizontalLine(x1, x2, currentY)
    drawVerticalLine(centerX, currentY, currentY + 40)
    currentY += 40
    drawHorizontalLine(x1, x2, currentY)
    drawVerticalLine(x1, currentY, currentY + 20)
    drawVerticalLine(x2, currentY, currentY + 20)
    currentY += 20
    drawSectionLabel(t('familyTree.visualisation.labels.children'), centerX, currentY)
    currentY += 40
    drawUser(childrenLayer[0], x1, currentY + 22)
    drawUser(childrenLayer[1], x2, currentY + 22)

    function drawSectionLabel(label: string, x: number, y: number) {
      const labelsGroup = svg
        .append('g')
        .attr('class', 'section-labels')
        .attr('text-anchor', 'middle')
        .attr('font-size', 18)
        .attr('font-weight', 'bold')
        .attr('fill', '#6b7280')
        .attr('letter-spacing', '1.5px')
      const group = labelsGroup.append('g')
      const textElement = group.append('text').attr('x', x).attr('y', y).attr('dominant-baseline', 'middle').text(label)

      const node = textElement.node()
      if (node) {
        const bbox = node.getBBox()
        group
          .insert('rect', 'text')
          .attr('x', bbox.x - SECTION_LABEL_PADDING_X)
          .attr('y', bbox.y - SECTION_LABEL_PADDING_Y)
          .attr('width', bbox.width + SECTION_LABEL_PADDING_X * 2)
          .attr('height', bbox.height + SECTION_LABEL_PADDING_Y * 2)
          .attr('rx', 999)
          .attr('fill', BACKGROUND_COLOR)
      }
    }

    function drawUser(node: TreeNode, x: number, y: number) {
      let clipCounter = 0
      const defs = svg.append('defs')
      const nodesGroup = svg.append('g').attr('class', 'nodes')

      const radius = getRadius(node.type)
      const nodeGroup = nodesGroup.append('g').attr('class', `user-node user-${node.type}`)

      nodeGroup
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .attr('fill', NODE_COLORS[node.type] || NODE_COLORS.default)
        .attr('stroke', '#fff')
        .attr('stroke-width', 5)

      const clipId = `clip-${sanitizeId(node.id)}-${clipCounter++}`
      const clipPath = defs.append('clipPath').attr('id', clipId)
      clipPath
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius - 5)

      const imageSize = (radius - 5) * 2
      nodeGroup
        .append('image')
        .attr('href', node.avatar)
        .attr('xlink:href', node.avatar)
        .attr('x', x - radius + 5)
        .attr('y', y - radius + 5)
        .attr('width', imageSize)
        .attr('height', imageSize)
        .attr('clip-path', `url(#${clipId})`)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('error', function () {
          d3.select(this).remove()
        })

      const usernameY = y + radius + USERNAME_BASELINE_OFFSET
      const text = nodeGroup
        .append('text')
        .attr('x', x)
        .attr('y', usernameY)
        .attr('text-anchor', 'middle')
        .attr('font-size', 16)
        .attr('font-weight', 500)
        .attr('fill', '#374151')
        .text(`@${node.username}`)

      const textNode = text.node()
      if (textNode) {
        const bbox = textNode.getBBox()
        nodeGroup
          .insert('rect', 'text')
          .attr('x', bbox.x - TEXT_PADDING_X)
          .attr('y', bbox.y - TEXT_PADDING_Y)
          .attr('width', bbox.width + TEXT_PADDING_X * 2)
          .attr('height', bbox.height + TEXT_PADDING_Y * 2)
          .attr('rx', 10)
          .attr('fill', BACKGROUND_COLOR)
      }

      return { x, y, radius }
    }

    function drawVerticalLine(x: number, y1: number, y2: number) {
      const connectorsGroup = svg
        .append('g')
        .attr('class', 'connectors')
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('fill', 'none')
      connectorsGroup.append('line').attr('x1', x).attr('y1', y1).attr('x2', x).attr('y2', y2)
    }

    function drawHorizontalLine(x1: number, x2: number, y: number) {
      const connectorsGroup = svg
        .append('g')
        .attr('class', 'connectors')
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('fill', 'none')
      connectorsGroup.append('line').attr('x1', x1).attr('y1', y).attr('x2', x2).attr('y2', y)
    }

    // if (parentsLayer.length > 0 && parentsY !== null && parentsConnectorY !== null) {
    //   drawSectionLabel('PARENTS', centerX, parentsConnectorY - SECTION_LABEL_OFFSET)

    //   const parentNodes = parentsLayer.slice(0, 2)
    //   const parentXs = parentNodes.length >= 2 ? [leftColumnX, rightColumnX] : [centerX]

    //   const parentPositions = parentNodes.map((node, index) => {
    //     const x = parentXs[Math.min(index, parentXs.length - 1)]
    //     const { radius } = drawUser(node, x, parentsY)
    //     return { x, radius }
    //   })

    //   if (parentPositions.length > 1) {
    //     // 计算父母之间水平连接线的Y坐标（向下延伸40像素）
    //     const parentLinkY = parentsY + NODE_RADIUS + 40

    //     // 从每个父母节点向下延伸到水平线
    //     parentPositions.forEach(({ x, radius }) => {
    //       connectorsGroup
    //         .append('line')
    //         .attr('x1', x)
    //         .attr('y1', parentsY + radius)
    //         .attr('x2', x)
    //         .attr('y2', parentLinkY)
    //     })

    //     // 水平连接两个父母
    //     connectorsGroup
    //       .append('line')
    //       .attr('x1', parentPositions[0].x)
    //       .attr('y1', parentLinkY)
    //       .attr('x2', parentPositions[parentPositions.length - 1].x)
    //       .attr('y2', parentLinkY)

    //     console.log('centerX, parentLinkY', parentLinkY, parentsConnectorY)
    //     // 从水平线中点继续向下到 parentsConnectorY
    //     connectorsGroup
    //       .append('line')
    //       .attr('x1', centerX)
    //       .attr('y1', parentLinkY + 34)
    //       .attr('x2', centerX)
    //       .attr('y2', parentsConnectorY + 30)
    //   } else {
    //     // 单个父母的情况，直接垂直连接
    //     parentPositions.forEach(({ x, radius }) => {
    //       connectorsGroup
    //         .append('line')
    //         .attr('x1', x)
    //         .attr('y1', parentsY + radius)
    //         .attr('x2', x)
    //         .attr('y2', parentsConnectorY)
    //     })
    //   }
    // }

    // // 从父母到"我"的连接逻辑
    // if (parentsConnectorY !== null) {
    //   // 计算转折点的Y坐标 (在父母汇合线和"我"之间)
    //   const turnY = (parentsConnectorY + rootTopY) / 2

    //   // 1. 从父母汇合线中心垂直向下
    //   // console.log('draw from parents to root', parentsConnectorY, turnY)
    //   // connectorsGroup
    //   //   .append('line')
    //   //   .attr('x1', centerX)
    //   //   .attr('y1', parentsConnectorY)
    //   //   .attr('x2', centerX)
    //   //   .attr('y2', turnY)

    //   // 2. 水平转折到"我"的X位置
    //   connectorsGroup.append('line').attr('x1', centerX).attr('y1', turnY).attr('x2', rootX).attr('y2', turnY)

    //   // 3. 垂直向下连接到"我"的头像顶部
    //   connectorsGroup.append('line').attr('x1', rootX).attr('y1', turnY).attr('x2', rootX).attr('y2', rootTopY)
    // }

    // // 从婚姻线到孩子的垂直主干
    // if (childrenConnectorY !== null) {
    //   connectorsGroup
    //     .append('line')
    //     .attr('x1', centerX)
    //     .attr('y1', marriageY)
    //     .attr('x2', centerX)
    //     .attr('y2', childrenConnectorY)
    // }

    // drawUser(rootNode, rootX, rootY)

    // connectorsGroup.append('line').attr('x1', rootX).attr('y1', rootBottomY).attr('x2', rootX).attr('y2', marriageY)

    // if (spouseNode && spouseX !== null) {
    //   drawSectionLabel('SPOUSE', spouseX, rootTopY - SECTION_LABEL_OFFSET)
    //   const spouseRadius = getRadius(spouseNode.type)
    //   drawUser(spouseNode, spouseX, rootY)

    //   connectorsGroup
    //     .append('line')
    //     .attr('x1', spouseX)
    //     .attr('y1', rootY + spouseRadius)
    //     .attr('x2', spouseX)
    //     .attr('y2', marriageY)

    //   connectorsGroup
    //     .append('line')
    //     .attr('x1', rootX)
    //     .attr('y1', marriageY)
    //     .attr('x2', spouseX)
    //     .attr('y2', marriageY)
    //     .attr('stroke', '#10b981')
    //     .attr('stroke-width', 4)
    // }

    // if (childrenLayer.length > 0 && childrenY !== null && childrenConnectorY !== null) {
    //   drawSectionLabel('CHILDREN', centerX, childrenConnectorY + SECTION_LABEL_OFFSET)

    //   const childNodes = childrenLayer.slice(0, 2)
    //   const childXs = childNodes.length >= 2 ? [leftColumnX, rightColumnX] : [centerX]

    //   if (childNodes.length > 1) {
    //     connectorsGroup
    //       .append('line')
    //       .attr('x1', childXs[0])
    //       .attr('y1', childrenConnectorY)
    //       .attr('x2', childXs[childXs.length - 1])
    //       .attr('y2', childrenConnectorY)
    //   }

    //   childNodes.forEach((node, index) => {
    //     const x = childXs[Math.min(index, childXs.length - 1)]
    //     const { radius } = drawUser(node, x, childrenY)

    //     connectorsGroup
    //       .append('line')
    //       .attr('x1', x)
    //       .attr('y1', childrenConnectorY)
    //       .attr('x2', x)
    //       .attr('y2', childrenY - radius)
    //   })
    // }

    return () => {
      svg.selectAll('*').remove()
    }
  }, [data, width, height, t])

  return <svg ref={svgRef} width={width} height={height} style={{ background: BACKGROUND_COLOR }} />
}
