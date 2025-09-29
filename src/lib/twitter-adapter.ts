/**
 * Twitter API Adapter
 * Convert official Twitter API types to simplified types used in the application
 */

import type { User, Tweet } from '../@types/twitter-web-api'

export interface TwitterUser {
  id: string
  username: string
  displayName: string
  avatar: string
  verified: boolean
}

export interface TwitterTweet {
  id: string
  text: string
  author: TwitterUser
  createdAt: string
  type: 'reply' | 'quote' | 'retweet' | 'original'
  replyTo?: TwitterUser
  quotedTweet?: TwitterTweet
  retweetedTweet?: TwitterTweet
  likeCount: number
  retweetCount: number
  replyCount: number
}

export interface TwitterLike {
  id: string
  tweet: TwitterTweet
  likedAt: string
}

/**
 * Process avatar URL, remove _normal suffix to get higher quality images
 */
function processAvatarUrl(url: string): string {
  if (url.endsWith('_normal.jpg') || url.endsWith('_normal.jpeg') || url.endsWith('_normal.png')) {
    return url.replace(/_normal\.(jpg|jpeg|png)$/, '.$1')
  }
  return url
}

function createPlaceholderReplyToUser(legacy: Tweet['legacy']): TwitterUser | undefined {
  const replyToUserId = legacy.in_reply_to_user_id_str

  if (!replyToUserId) {
    return undefined
  }

  const replyToScreenName = legacy.in_reply_to_screen_name || ''
  const mentionedUser = legacy.entities?.user_mentions?.find((mention) => mention.screen_name === replyToScreenName)

  const displayName = mentionedUser?.name || replyToScreenName || replyToUserId
  const avatarScreenName = replyToScreenName || replyToUserId

  return {
    id: replyToUserId,
    username: replyToScreenName,
    displayName,
    avatar: `https://unavatar.io/twitter/${encodeURIComponent(avatarScreenName)}`,
    verified: false,
  }
}

/**
 * Convert official User type to simplified TwitterUser type
 */
export function convertUser(user: User): TwitterUser {
  return {
    id: user.rest_id,
    username: user.core.screen_name,
    displayName: user.core.name,
    avatar: processAvatarUrl(user.avatar.image_url),
    verified: user.verification.verified || user.is_blue_verified,
  }
}

/**
 * Convert official Tweet type to simplified TwitterTweet type
 */
export function convertTweet(tweet: Tweet): TwitterTweet {
  const legacy = tweet.legacy
  const user = tweet.core?.user_results?.result

  if (!legacy || !user || user.__typename !== 'User') {
    throw new Error('Invalid tweet data')
  }

  return {
    id: tweet.rest_id,
    text: legacy.full_text || '',
    author: convertUser(user),
    createdAt: legacy.created_at || new Date().toISOString(),
    type: legacy.in_reply_to_status_id_str
      ? 'reply'
      : legacy.is_quote_status
        ? 'quote'
        : legacy.retweeted_status_result
          ? 'retweet'
          : 'original',
    replyTo: createPlaceholderReplyToUser(legacy),
    likeCount: legacy.favorite_count || 0,
    retweetCount: legacy.retweet_count || 0,
    replyCount: legacy.reply_count || 0,
  }
}
