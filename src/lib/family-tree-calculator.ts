import { TwitterUser } from './twitter-adapter'
import { UserInteraction } from './interaction-calculator'

export interface TreeNode {
  id: string
  name: string
  username: string
  avatar: string
  type: 'root' | 'parent' | 'spouse' | 'child'
  relationLabel?: string
  children?: TreeNode[]
}

export interface FamilyTreeData {
  layers: TreeNode[][]
  totalNodes: number
  followingCount: number
  followersCount: number
  mutualCount: number
  analysisDate: string
}

export interface UserRelationship {
  user: TwitterUser
  isFollowing: boolean
  isFollower: boolean
  isMutual: boolean
}

interface NodeSortMetrics {
  totalScore: number
  relationPriority: number
  interactionWeight: number
  lastInteractionTimestamp: number
  verifiedBonus: number
}

export class FamilyTreeCalculator {
  /**
   * Build relationships between users
   */
  buildRelationships(following: TwitterUser[], followers: TwitterUser[]): Map<string, UserRelationship> {
    const relationships = new Map<string, UserRelationship>()

    // Create set for faster lookup
    const followerIds = new Set(followers.map((u) => u.id))

    // Process following users
    following.forEach((user) => {
      const isMutual = followerIds.has(user.id)
      relationships.set(user.id, {
        user,
        isFollowing: true,
        isFollower: isMutual,
        isMutual,
      })
    })

    // Process followers who are not already in following
    followers.forEach((user) => {
      if (!relationships.has(user.id)) {
        relationships.set(user.id, {
          user,
          isFollowing: false,
          isFollower: true,
          isMutual: false,
        })
      }
    })

    return relationships
  }

  /**
   * Generate tree data for visualization (layered structure)
   * Traditional family tree: 2 parents + you + 1 spouse + 2 children
   * Uses interaction weights to select the most relevant users
   */
  generateTreeData(
    relationships: Map<string, UserRelationship>,
    targetUser: TwitterUser,
    interactionWeights?: Map<string, UserInteraction>,
  ): FamilyTreeData {
    const metricsCache = new Map<string, NodeSortMetrics>()

    const computeMetrics = (relationship: UserRelationship): NodeSortMetrics => {
      const cached = metricsCache.get(relationship.user.id)
      if (cached) {
        return cached
      }

      const interaction = interactionWeights?.get(relationship.user.id)
      const relationPriority = relationship.isMutual
        ? 3
        : relationship.isFollowing
          ? 2
          : relationship.isFollower
            ? 1
            : 0
      const interactionWeight = interaction?.weight ?? 0
      const verifiedBonus = relationship.user.verified ? 10 : 0

      const parsedLastInteraction = interaction?.lastInteraction ? Date.parse(interaction.lastInteraction) : NaN
      const lastInteractionTimestamp = Number.isFinite(parsedLastInteraction) ? parsedLastInteraction : 0

      const totalScore = relationPriority * 50 + interactionWeight + verifiedBonus

      const metrics: NodeSortMetrics = {
        totalScore,
        relationPriority,
        interactionWeight,
        lastInteractionTimestamp,
        verifiedBonus,
      }

      metricsCache.set(relationship.user.id, metrics)
      return metrics
    }

    const compareNodes = (a: TreeNode, b: TreeNode) => {
      const metricsA = metricsCache.get(a.id)
      const metricsB = metricsCache.get(b.id)

      if (metricsA && metricsB) {
        if (metricsA.totalScore !== metricsB.totalScore) {
          return metricsB.totalScore - metricsA.totalScore
        }

        if (metricsA.lastInteractionTimestamp !== metricsB.lastInteractionTimestamp) {
          return metricsB.lastInteractionTimestamp - metricsA.lastInteractionTimestamp
        }

        if (metricsA.interactionWeight !== metricsB.interactionWeight) {
          return metricsB.interactionWeight - metricsA.interactionWeight
        }
      }

      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    }

    const mutualUsers: TreeNode[] = []
    const followingOnlyUsers: TreeNode[] = []
    const followerOnlyUsers: TreeNode[] = []

    let mutualCount = 0
    let followingCount = 0
    let followersCount = 0

    // Categorize users
    relationships.forEach((relationship) => {
      const node: TreeNode = {
        id: relationship.user.id,
        name: relationship.user.displayName,
        username: relationship.user.username,
        avatar: relationship.user.avatar,
        type: relationship.isMutual ? 'spouse' : relationship.isFollowing ? 'parent' : 'child',
        relationLabel: relationship.isMutual ? 'Mutual' : relationship.isFollowing ? 'Following' : 'Follower',
      }

      computeMetrics(relationship)

      if (relationship.isMutual) {
        mutualUsers.push(node)
        mutualCount++
        followingCount++
        followersCount++
      } else if (relationship.isFollowing) {
        followingOnlyUsers.push(node)
        followingCount++
      } else {
        followerOnlyUsers.push(node)
        followersCount++
      }
    })

    mutualUsers.sort(compareNodes)
    followingOnlyUsers.sort(compareNodes)
    followerOnlyUsers.sort(compareNodes)

    // Build traditional family tree structure
    const layers: TreeNode[][] = []

    // Layer 0: 2 Parents (people you follow)
    const parents = followingOnlyUsers.slice(0, 2)
    if (parents.length > 0) {
      layers.push(parents)
    }

    // Layer 1: You + Spouse (mutual follow)
    const middleLayer: TreeNode[] = []

    // Add root user (you)
    middleLayer.push({
      id: targetUser.id,
      name: targetUser.displayName,
      username: targetUser.username,
      avatar: targetUser.avatar,
      type: 'root',
      relationLabel: 'You',
    })

    // Add 1 spouse (mutual follow) next to you
    if (mutualUsers.length > 0) {
      middleLayer.push(mutualUsers[0])
    }

    layers.push(middleLayer)

    // Layer 2: 2 Children (your followers)
    const children = followerOnlyUsers.slice(0, 2)
    if (children.length > 0) {
      layers.push(children)
    }

    // Calculate total nodes
    const totalNodes = layers.reduce((sum, layer) => sum + layer.length, 0)

    return {
      layers,
      totalNodes,
      followingCount,
      followersCount,
      mutualCount,
      analysisDate: new Date().toLocaleDateString(),
    }
  }
}
