/**
 * Twitter API Proxy Layer
 * Communicate with Twitter API through browser extension
 */

import {
  TwitterTweet,
  TwitterLike,
  TwitterUser,
  convertTweet,
} from './twitter-adapter'

/**
 * Process avatar URL, remove _normal suffix to get higher quality images
 */
function processAvatarUrl(url: string): string {
  if (
    url.endsWith('_normal.jpg') ||
    url.endsWith('_normal.jpeg') ||
    url.endsWith('_normal.png')
  ) {
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
      const hasExtensionMarker =
        document.documentElement.dataset.twitterWebAPI === 'true'
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
      const user = await window.__TWITTER_WEB_API__.getUserByScreenName(
        username,
      )
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
    count: number = 500,
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
      const user = await window.__TWITTER_WEB_API__.getUserByScreenName(
        username,
      )
      if (!user) {
        throw new Error(`User @${username} does not exist`)
      }

      const allReplies: TwitterTweet[] = []
      let cursor: string | undefined
      let hasMore = true

      while (hasMore && allReplies.length < count) {
        const response =
          await window.__TWITTER_WEB_API__.getUserTweetsAndReplies({
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
    count: number = 1000,
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
      const user = await window.__TWITTER_WEB_API__.getUserByScreenName(
        username,
      )
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
   * Method for development testing - get mock reply data
   */
  async getTestReplies(
    username: string,
    count: number = 100,
  ): Promise<TwitterTweet[]> {
    return this.getMockReplies(username, count)
  }

  /**
   * Method for development testing - get mock like data
   */
  async getTestLikes(
    username: string,
    count: number = 200,
  ): Promise<TwitterLike[]> {
    return this.getMockLikes(username, count)
  }

  /**
   * Generate mock reply data (for development testing)
   */
  private getMockReplies(username: string, count: number): TwitterTweet[] {
    const mockUsers = [
      {
        id: '1',
        username: 'alice_dev',
        displayName: 'Alice Developer',
        avatar: 'https://i.pravatar.cc/150?u=alice',
        verified: false,
      },
      {
        id: '2',
        username: 'bob_designer',
        displayName: 'Bob Designer',
        avatar: 'https://i.pravatar.cc/150?u=bob',
        verified: true,
      },
      {
        id: '3',
        username: 'charlie_pm',
        displayName: 'Charlie PM',
        avatar: 'https://i.pravatar.cc/150?u=charlie',
        verified: false,
      },
      {
        id: '4',
        username: 'diana_writer',
        displayName: 'Diana Writer',
        avatar: 'https://i.pravatar.cc/150?u=diana',
        verified: true,
      },
      {
        id: '5',
        username: 'eve_analyst',
        displayName: 'Eve Analyst',
        avatar: 'https://i.pravatar.cc/150?u=eve',
        verified: false,
      },
    ]

    const replies: TwitterTweet[] = []
    const now = Date.now()

    for (let i = 0; i < Math.min(count, 100); i++) {
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
      const daysAgo = Math.floor(Math.random() * 30)
      const createdAt = new Date(
        now - daysAgo * 24 * 60 * 60 * 1000,
      ).toISOString()

      replies.push({
        id: `reply_${i}`,
        text: `This is a reply to @${username} content ${i + 1}`,
        author: user,
        createdAt,
        type: Math.random() > 0.3 ? 'reply' : 'quote',
        likeCount: Math.floor(Math.random() * 50),
        retweetCount: Math.floor(Math.random() * 20),
        replyCount: Math.floor(Math.random() * 10),
      })
    }

    return replies
  }

  /**
   * Generate mock like data (for development testing)
   */
  private getMockLikes(_username: string, count: number): TwitterLike[] {
    const mockUsers = [
      {
        id: '1',
        username: 'alice_dev',
        displayName: 'Alice Developer',
        avatar: 'https://i.pravatar.cc/150?u=alice',
        verified: false,
      },
      {
        id: '2',
        username: 'bob_designer',
        displayName: 'Bob Designer',
        avatar: 'https://i.pravatar.cc/150?u=bob',
        verified: true,
      },
      {
        id: '3',
        username: 'charlie_pm',
        displayName: 'Charlie PM',
        avatar: 'https://i.pravatar.cc/150?u=charlie',
        verified: false,
      },
      {
        id: '4',
        username: 'diana_writer',
        displayName: 'Diana Writer',
        avatar: 'https://i.pravatar.cc/150?u=diana',
        verified: true,
      },
      {
        id: '5',
        username: 'eve_analyst',
        displayName: 'Eve Analyst',
        avatar: 'https://i.pravatar.cc/150?u=eve',
        verified: false,
      },
    ]

    const likes: TwitterLike[] = []
    const now = Date.now()

    for (let i = 0; i < Math.min(count, 200); i++) {
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
      const daysAgo = Math.floor(Math.random() * 30)
      const likedAt = new Date(
        now - daysAgo * 24 * 60 * 60 * 1000,
      ).toISOString()

      likes.push({
        id: `like_${i}`,
        likedAt,
        tweet: {
          id: `tweet_${i}`,
          text: `This is a tweet content posted by @${user.username} ${i + 1}`,
          author: user,
          createdAt: likedAt,
          type: 'original',
          likeCount: Math.floor(Math.random() * 100),
          retweetCount: Math.floor(Math.random() * 50),
          replyCount: Math.floor(Math.random() * 25),
        },
      })
    }

    return likes
  }
}
