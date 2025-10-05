/**
 * Twitter API Proxy Layer
 * Communicate with Twitter API through browser extension
 */

import { TwitterTweet, TwitterLike, TwitterUser, convertTweet, convertUser } from './twitter-adapter'
import { User } from '../@types/twitter-web-api'

export class TwitterAPIProxy {
  /**
   * Check if browser extension is available
   */
  private async checkExtensionAvailability(): Promise<boolean> {
    try {
      // Check if in browser environment
      if (typeof window === 'undefined') return false

      // 1. Check if extension is installed (check dataset.twitterWebAPI)
      const hasExtensionMarker = document.documentElement.dataset.twitterWebAPI === 'true'
      if (!hasExtensionMarker) {
        console.warn('Twitter Web API Extension Not Installed')
        return false
      }

      // 2. Check if extension has injected global variables
      if (!window.__TWITTER_WEB_API__) {
        console.warn('Twitter Web API Global Object Not Found')
        return false
      }

      return true
    } catch (error) {
      console.error('Extension availability check failed:', error)
      return false
    }
  }

  /**
   * Get user information by username
   */
  async getUserByScreenName(username: string): Promise<User> {
    const isAvailable = await this.checkExtensionAvailability()

    if (!isAvailable) {
      throw new Error(
        'Twitter Web API Extension Not Installed or Activated. Please install and activate the extension first.',
      )
    }

    try {
      const user = await window.__TWITTER_WEB_API__.getUserByScreenName(username)
      if (!user) {
        throw new Error(`User @${username} does not exist`)
      }

      return user
    } catch (error) {
      console.error('Failed to get user information:', error)
      throw new Error(`Failed to get user @${username} information, please try again`)
    }
  }

  /**
   * Get user's reply data (supports pagination)
   */
  async getReplies(
    username: string,
    count: number,
    onProgress?: (current: number, total: number) => void,
  ): Promise<TwitterTweet[]> {
    const isAvailable = await this.checkExtensionAvailability()

    if (!isAvailable) {
      throw new Error(
        'Twitter Web API Extension Not Installed or Activated. Please install and activate the extension first.',
      )
    }

    try {
      // First get user information
      const user = await window.__TWITTER_WEB_API__.getUserByScreenName(username)
      if (!user) {
        throw new Error(`User @${username} does not exist`)
      }

      const allReplies: TwitterTweet[] = []
      let cursor: string | undefined
      let hasMore = true

      while (hasMore && allReplies.length < count) {
        const response = await window.__TWITTER_WEB_API__.getUserTweetsAndReplies({
          userId: user.rest_id,
          cursor,
          count: Math.min(100, count - allReplies.length), // Get up to 100 at a time
        })

        // Convert tweet data and filter out replies
        const convertedTweets = response.data
          .map((tweet: any) => convertTweet(tweet))
          .filter((tweet: TwitterTweet) => tweet.type === 'reply')

        allReplies.push(...convertedTweets)
        cursor = response.cursor?.bottom
        hasMore = !!cursor && response.data.length > 0

        // Report progress
        onProgress?.(allReplies.length, count)
      }

      return allReplies.slice(0, count)
    } catch (error) {
      console.error('Failed to get reply data:', error)
      throw new Error(
        'Unable to get reply data, please ensure the browser extension is installed and logged into Twitter',
      )
    }
  }

  /**
   * Get user's like data (supports pagination)
   */
  async getLikes(
    username: string,
    count: number,
    onProgress?: (current: number, total: number) => void,
  ): Promise<TwitterLike[]> {
    const isAvailable = await this.checkExtensionAvailability()

    if (!isAvailable) {
      throw new Error(
        'Twitter Web API Extension Not Installed or Activated. Please install and activate the extension first.',
      )
    }

    try {
      // First get user information
      const user = await window.__TWITTER_WEB_API__.getUserByScreenName(username)
      if (!user) {
        throw new Error(`User @${username} does not exist`)
      }

      const allLikes: TwitterLike[] = []
      let cursor: string | undefined
      let hasMore = true

      while (hasMore && allLikes.length < count) {
        const response = await window.__TWITTER_WEB_API__.getLikes({
          userId: user.rest_id,
          cursor,
          count: Math.min(100, count - allLikes.length), // Get up to 100 at a time
        })

        // Convert like data
        const convertedLikes = response.data.map((tweet: any) => ({
          id: `like_${tweet.rest_id}`,
          tweet: convertTweet(tweet),
          likedAt: new Date().toISOString(), // API may not provide like time, use current time
        }))

        allLikes.push(...convertedLikes)
        cursor = response.cursor?.bottom
        hasMore = !!cursor && response.data.length > 0

        // Report progress
        onProgress?.(allLikes.length, count)
      }

      return allLikes.slice(0, count)
    } catch (error) {
      console.error('Failed to get like data:', error)
      throw new Error(
        'Unable to get like data, please ensure the browser extension is installed and logged into Twitter',
      )
    }
  }

  /**
   * Get user's following list (supports pagination)
   */
  async getFollowing(
    userId: string,
    count: number,
    onProgress?: (current: number, total: number) => void,
  ): Promise<TwitterUser[]> {
    const isAvailable = await this.checkExtensionAvailability()

    if (!isAvailable) {
      throw new Error(
        'Twitter Web API Extension Not Installed or Activated. Please install and activate the extension first.',
      )
    }

    try {
      const allFollowing: TwitterUser[] = []
      let cursor: string | undefined
      let hasMore = true

      while (hasMore && allFollowing.length < count) {
        const response = await window.__TWITTER_WEB_API__.getFollowing({
          userId,
          cursor,
          count: Math.min(100, count - allFollowing.length),
        })

        // Convert users to apply avatar processing
        const convertedUsers = response.data.map((user: User) => convertUser(user))
        allFollowing.push(...convertedUsers)
        cursor = response.cursor?.bottom
        hasMore = !!cursor && response.data.length > 0

        onProgress?.(allFollowing.length, count)
      }

      return allFollowing.slice(0, count)
    } catch (error) {
      console.error('Failed to get following data:', error)
      throw new Error(
        'Unable to get following data, please ensure the browser extension is installed and logged into Twitter',
      )
    }
  }

  /**
   * Get user's followers list (supports pagination)
   */
  async getFollowers(
    userId: string,
    count: number,
    onProgress?: (current: number, total: number) => void,
  ): Promise<TwitterUser[]> {
    const isAvailable = await this.checkExtensionAvailability()

    if (!isAvailable) {
      throw new Error(
        'Twitter Web API Extension Not Installed or Activated. Please install and activate the extension first.',
      )
    }

    try {
      const allFollowers: TwitterUser[] = []
      let cursor: string | undefined
      let hasMore = true

      while (hasMore && allFollowers.length < count) {
        const response = await window.__TWITTER_WEB_API__.getFollowers({
          userId,
          cursor,
          count: Math.min(100, count - allFollowers.length),
        })

        // Convert users to apply avatar processing
        const convertedUsers = response.data.map((user: User) => convertUser(user))
        allFollowers.push(...convertedUsers)
        cursor = response.cursor?.bottom
        hasMore = !!cursor && response.data.length > 0

        onProgress?.(allFollowers.length, count)
      }

      return allFollowers.slice(0, count)
    } catch (error) {
      console.error('Failed to get followers data:', error)
      throw new Error(
        'Unable to get followers data, please ensure the browser extension is installed and logged into Twitter',
      )
    }
  }
}
