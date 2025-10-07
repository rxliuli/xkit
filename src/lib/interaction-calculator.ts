import { TwitterTweet, TwitterLike, TwitterUser } from './twitter-adapter'

/**
 * User interaction data interface
 */
export interface UserInteraction {
  user: TwitterUser
  interactions: {
    replies: number
    incomingReplies: number
    outgoingReplies: number
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
  direction: 'incoming' | 'outgoing'
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
  totalIncomingReplies: number
  totalOutgoingReplies: number
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
  parseInteractions(
    replies: TwitterTweet[],
    likes: TwitterLike[],
    currentUser: TwitterUser,
  ): Map<string, UserInteraction> {
    const userMap = new Map<string, UserInteraction>()

    for (const tweet of replies) {
      const { author, type, replyTo, createdAt, id } = tweet
      switch (type) {
        case 'reply':
          if (author.id === currentUser.id) {
            if (!replyTo) {
              continue
            }

            this.recordInteraction(userMap, replyTo, currentUser, {
              type: 'reply',
              direction: 'outgoing',
              timestamp: createdAt,
              tweetId: id,
            })
            continue
          }

          if (replyTo && replyTo.id === currentUser.id) {
            this.recordInteraction(userMap, author, currentUser, {
              type: 'reply',
              direction: 'incoming',
              timestamp: createdAt,
              tweetId: id,
            })
          }
          break
        case 'quote':
        case 'retweet':
          this.recordInteraction(userMap, author, currentUser, {
            type,
            direction: 'incoming',
            timestamp: createdAt,
            tweetId: id,
          })
          break
        default:
          break
      }
    }

    for (const like of likes) {
      this.recordInteraction(userMap, like.tweet.author, currentUser, {
        type: 'like',
        direction: 'incoming',
        timestamp: like.likedAt,
        tweetId: like.tweet.id,
      })
    }

    return userMap
  }

  private recordInteraction(
    userMap: Map<string, UserInteraction>,
    interactingUser: TwitterUser,
    currentUser: TwitterUser,
    event: InteractionEvent,
  ): void {
    if (interactingUser.id === currentUser.id) {
      return
    }

    const userInteraction = this.getOrCreateUserInteraction(userMap, interactingUser.id, interactingUser)

    userInteraction.user = {
      ...userInteraction.user,
      ...interactingUser,
    }

    switch (event.type) {
      case 'reply':
        userInteraction.interactions.replies++
        if (event.direction === 'incoming') {
          userInteraction.interactions.incomingReplies++
        } else {
          userInteraction.interactions.outgoingReplies++
        }
        break
      case 'like':
        userInteraction.interactions.likes++
        break
      case 'quote':
        userInteraction.interactions.quotes++
        break
      case 'retweet':
        userInteraction.interactions.retweets++
        break
    }

    userInteraction.interactionHistory.push({
      ...event,
    })

    if (new Date(event.timestamp) > new Date(userInteraction.lastInteraction)) {
      userInteraction.lastInteraction = event.timestamp
    }

    userMap.set(interactingUser.id, userInteraction)
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
          incomingReplies: 0,
          outgoingReplies: 0,
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
    const { incomingReplies, outgoingReplies, likes } = sortedUsers.reduce(
      (totals, user) => {
        totals.incomingReplies += user.interactions.incomingReplies
        totals.outgoingReplies += user.interactions.outgoingReplies
        totals.likes += user.interactions.likes
        return totals
      },
      { incomingReplies: 0, outgoingReplies: 0, likes: 0 },
    )
    const totalReplies = incomingReplies + outgoingReplies

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
      totalLikes: likes,
      totalIncomingReplies: incomingReplies,
      totalOutgoingReplies: outgoingReplies,
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
