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

    // Sort by interaction weight if available, otherwise by name
    const sortByInteraction = (a: TreeNode, b: TreeNode) => {
      if (interactionWeights) {
        const weightA = interactionWeights.get(a.id)?.weight || 0
        const weightB = interactionWeights.get(b.id)?.weight || 0
        if (weightA !== weightB) {
          return weightB - weightA // Higher weight first
        }
      }
      return a.name.localeCompare(b.name)
    }

    mutualUsers.sort(sortByInteraction)
    followingOnlyUsers.sort(sortByInteraction)
    followerOnlyUsers.sort(sortByInteraction)

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
