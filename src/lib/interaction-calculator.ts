import { TwitterTweet, TwitterLike, TwitterUser } from './twitter-adapter'

/**
 * User interaction data interface
 */
export interface UserInteraction {
  user: TwitterUser
  interactions: {
    replies: number
    quotes: number
    retweets: number
    likes: number
  }
  weight: number
  lastInteraction: string
  interactionHistory: InteractionEvent[]
}

/**
 * Interaction event interface
 */
export interface InteractionEvent {
  type: 'reply' | 'quote' | 'retweet' | 'like'
  timestamp: string
  tweetId: string
}

/**
 * Circle data interface
 */
export interface CircleData {
  users: UserInteraction[]
  currentUser: TwitterUser
  totalUsers: number
  totalReplies: number
  totalLikes: number
  analysisDate: string
  timeRange: {
    start: string
    end: string
  }
}

/**
 * Interaction weight configuration
 */
export interface WeightConfig {
  reply: number
  quote: number
  retweet: number
  like: number
  timeDecayFactor: number // Time decay factor
}

/**
 * Interaction calculator class
 */
export class InteractionCalculator {
  private config: WeightConfig = {
    reply: 3.0,
    quote: 2.5,
    retweet: 1.5,
    like: 0.5,
    timeDecayFactor: 0.1, // 10% decay per day
  }

  constructor(config?: Partial<WeightConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Parse interaction data
   */
  parseInteractions(replies: TwitterTweet[], likes: TwitterLike[]): Map<string, UserInteraction> {
    const userMap = new Map<string, UserInteraction>()

    // Process reply data
    replies.forEach((tweet) => {
      const userId = tweet.author.id
      const user = this.getOrCreateUserInteraction(userMap, userId, tweet.author)

      // Increase corresponding interaction count based on type
      if (tweet.type === 'reply') {
        user.interactions.replies++
      } else if (tweet.type === 'quote') {
        user.interactions.quotes++
      } else if (tweet.type === 'retweet') {
        user.interactions.retweets++
      }

      // Add interaction history
      user.interactionHistory.push({
        type: tweet.type as 'reply' | 'quote' | 'retweet',
        timestamp: tweet.createdAt,
        tweetId: tweet.id,
      })

      // Update last interaction time
      if (new Date(tweet.createdAt) > new Date(user.lastInteraction)) {
        user.lastInteraction = tweet.createdAt
      }
    })

    // Process like data
    likes.forEach((like) => {
      const userId = like.tweet.author.id
      const user = this.getOrCreateUserInteraction(userMap, userId, like.tweet.author)

      user.interactions.likes++

      // Add interaction history
      user.interactionHistory.push({
        type: 'like',
        timestamp: like.likedAt,
        tweetId: like.tweet.id,
      })

      // Update last interaction time
      if (new Date(like.likedAt) > new Date(user.lastInteraction)) {
        user.lastInteraction = like.likedAt
      }
    })

    return userMap
  }

  /**
   * Get or create user interaction record
   */
  private getOrCreateUserInteraction(
    userMap: Map<string, UserInteraction>,
    userId: string,
    user: TwitterUser,
  ): UserInteraction {
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        user,
        interactions: {
          replies: 0,
          quotes: 0,
          retweets: 0,
          likes: 0,
        },
        weight: 0,
        lastInteraction: '1970-01-01T00:00:00.000Z',
        interactionHistory: [],
      })
    }
    return userMap.get(userId)!
  }

  /**
   * Calculate interaction weights
   */
  calculateWeights(userInteractions: Map<string, UserInteraction>): Map<string, UserInteraction> {
    const now = Date.now()

    userInteractions.forEach((interaction, userId) => {
      let totalWeight = 0

      // Basic weight calculation
      totalWeight += interaction.interactions.replies * this.config.reply
      totalWeight += interaction.interactions.quotes * this.config.quote
      totalWeight += interaction.interactions.retweets * this.config.retweet
      totalWeight += interaction.interactions.likes * this.config.like

      // Time decay calculation
      const daysSinceLastInteraction = (now - new Date(interaction.lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
      const timeDecay = Math.exp(-this.config.timeDecayFactor * daysSinceLastInteraction)

      interaction.weight = totalWeight * timeDecay
      userInteractions.set(userId, interaction)
    })

    return userInteractions
  }

  /**
   * Generate circle data
   */
  generateCircleData(
    userInteractions: Map<string, UserInteraction>,
    currentUser: TwitterUser,
    limit: number = 50,
  ): CircleData {
    // Sort by weight and take the top N users, excluding current user
    const sortedUsers = Array.from(userInteractions.values())
      .filter((user) => user.weight > 0) // Filter out users with zero weight
      .filter((user) => user.user.id !== currentUser.id) // Exclude current user
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)

    // Calculate statistics
    const totalReplies = sortedUsers.reduce((sum, user) => sum + user.interactions.replies, 0)
    const totalLikes = sortedUsers.reduce((sum, user) => sum + user.interactions.likes, 0)

    // Find time range
    const allTimestamps = sortedUsers.flatMap((user) => user.interactionHistory.map((event) => event.timestamp))

    const startTime =
      allTimestamps.length > 0
        ? new Date(Math.min(...allTimestamps.map((t) => new Date(t).getTime()))).toISOString()
        : new Date().toISOString()

    const endTime =
      allTimestamps.length > 0
        ? new Date(Math.max(...allTimestamps.map((t) => new Date(t).getTime()))).toISOString()
        : new Date().toISOString()

    return {
      users: sortedUsers,
      currentUser,
      totalUsers: sortedUsers.length,
      totalReplies,
      totalLikes,
      analysisDate: new Date().toLocaleDateString('en-US'),
      timeRange: {
        start: startTime,
        end: endTime,
      },
    }
  }

  /**
   * Update weight configuration
   */
  updateConfig(newConfig: Partial<WeightConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current weight configuration
   */
  getConfig(): WeightConfig {
    return { ...this.config }
  }

  /**
   * Analyze interaction trends
   */
  analyzeInteractionTrends(userInteractions: Map<string, UserInteraction>): {
    dailyInteractions: { date: string; count: number }[]
    topInteractionTypes: { type: string; count: number; percentage: number }[]
  } {
    const dailyMap = new Map<string, number>()
    const typeMap = new Map<string, number>()

    userInteractions.forEach((user) => {
      user.interactionHistory.forEach((event) => {
        // Statistics by date
        const date = event.timestamp.split('T')[0]
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1)

        // Statistics by type
        typeMap.set(event.type, (typeMap.get(event.type) || 0) + 1)
      })
    })

    const totalInteractions = Array.from(typeMap.values()).reduce((sum, count) => sum + count, 0)

    return {
      dailyInteractions: Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),

      topInteractionTypes: Array.from(typeMap.entries())
        .map(([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / totalInteractions) * 100),
        }))
        .sort((a, b) => b.count - a.count),
    }
  }
}
