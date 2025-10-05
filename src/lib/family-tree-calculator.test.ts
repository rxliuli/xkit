import { describe, expect, it } from 'vitest'
import { FamilyTreeCalculator } from './family-tree-calculator'
import type { TwitterUser } from './twitter-adapter'
import type { UserInteraction } from './interaction-calculator'

const createUser = (id: string, name: string, verified = false): TwitterUser => ({
  id,
  username: name.toLowerCase(),
  displayName: name,
  avatar: `https://example.com/${id}.png`,
  verified,
})

const createInteraction = (user: TwitterUser, weight: number, lastInteraction: string): UserInteraction => ({
  user,
  interactions: {
    replies: 0,
    quotes: 0,
    retweets: 0,
    likes: 0,
  },
  weight,
  lastInteraction,
  interactionHistory: [],
})

describe('FamilyTreeCalculator sorting', () => {
  it('orders parents by descending interaction weight', () => {
    const targetUser = createUser('target', 'Target User')
    const following = [createUser('1', 'Alice'), createUser('2', 'Bob', true), createUser('3', 'Carol')]
    const followers: TwitterUser[] = []

    const calculator = new FamilyTreeCalculator()
    const relationships = calculator.buildRelationships(following, followers)

    const interactionWeights = new Map<string, UserInteraction>([
      ['1', createInteraction(following[0], 20, '2024-01-01T00:00:00.000Z')],
      ['2', createInteraction(following[1], 40, '2024-02-01T00:00:00.000Z')],
      ['3', createInteraction(following[2], 80, '2024-03-01T00:00:00.000Z')],
    ])

    const treeData = calculator.generateTreeData(relationships, targetUser, interactionWeights)

    const parentsLayer = treeData.layers[0]
    expect(parentsLayer).toBeDefined()
    expect(parentsLayer?.map((node) => node.id)).toEqual(['3', '2'])
  })

  it('uses recency as a tiebreaker when weights match', () => {
    const targetUser = createUser('target', 'Target User')
    const following = [createUser('10', 'Daisy'), createUser('11', 'Ethan')]
    const followers: TwitterUser[] = []

    const calculator = new FamilyTreeCalculator()
    const relationships = calculator.buildRelationships(following, followers)

    const interactionWeights = new Map<string, UserInteraction>([
      ['10', createInteraction(following[0], 50, '2024-01-05T12:00:00.000Z')],
      ['11', createInteraction(following[1], 50, '2024-05-05T12:00:00.000Z')],
    ])

    const treeData = calculator.generateTreeData(relationships, targetUser, interactionWeights)

    const parentsLayer = treeData.layers[0]
    expect(parentsLayer).toBeDefined()
    expect(parentsLayer?.[0]?.id).toBe('11')
  })
})
