/**
 * Twitter API Proxy Layer
 * Communicate with Twitter API through browser extension
 */

import { TwitterTweet, TwitterLike, TwitterUser, convertTweet } from './twitter-adapter'

/**
 * Process avatar URL, remove _normal suffix to get higher quality images
 */
function processAvatarUrl(url: string): string {
  if (url.endsWith('_normal.jpg') || url.endsWith('_normal.jpeg') || url.endsWith('_normal.png')) {
    return url.replace(/_normal\.(jpg|jpeg|png)$/, '.$1')
  }
  return url
}

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
  async getUserByScreenName(username: string): Promise<TwitterUser> {
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

      return {
        id: user.rest_id,
        username: user.core.screen_name,
        displayName: user.core.name,
        avatar: processAvatarUrl(user.avatar.image_url),
        verified: user.verification.verified || user.is_blue_verified,
      }
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
}
