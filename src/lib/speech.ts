import type { BookOptions, DividerBlock, MemberProfile, PageSlice, SpeechBubble } from "../types"

type VerticalLayoutItem = {
  id: string
  y: number
  zIndex: number
  height: number
}

export const DIALOGUE_LAYOUT_GAP = 1.2
export const DIALOGUE_LAYOUT_MAX_BOTTOM = 94

type FlowOrderItem = {
  id: string
  anchor: number
  order: number
  rank: number
  type: "bubble" | "divider"
}

export function moveSpeechBubble(
  bubbles: SpeechBubble[],
  dividers: DividerBlock[],
  id: string,
  direction: -1 | 1,
) {
  const bubble = bubbles.find((item) => item.id === id)
  if (!bubble) return bubbles
  const ordered: FlowOrderItem[] = [
    ...bubbles
      .filter((item) => (item.page === 0) === (bubble.page === 0))
      .map((item) => ({ id: item.id, anchor: item.anchor, order: item.zIndex, rank: item.flowRank ?? 0, type: "bubble" as const })),
    ...(bubble.page === 0
      ? []
      : dividers.map((divider) => ({ id: divider.id, anchor: divider.anchor, order: divider.order, rank: 1, type: "divider" as const }))),
  ].sort((left, right) => left.anchor - right.anchor || left.rank - right.rank || left.order - right.order)
  const target = ordered[ordered.findIndex((item) => item.id === id) + direction]
  if (!target) return bubbles

  const bubbleRank = bubble.flowRank ?? 0
  if (target.type === "bubble" && target.anchor === bubble.anchor && target.rank === bubbleRank) {
    return bubbles.map((item) => item.id === bubble.id
      ? { ...item, zIndex: target.order }
      : item.id === target.id ? { ...item, zIndex: bubble.zIndex } : item)
  }

  const peers = ordered
    .filter((item) => item.id !== bubble.id && item.anchor === target.anchor && item.rank === target.rank)
    .sort((left, right) => left.order - right.order)
  const targetIndex = peers.findIndex((item) => item.id === target.id)
  const neighbour = peers[targetIndex + direction]
  const zIndex = neighbour === undefined
    ? target.order + direction
    : (target.order + neighbour.order) / 2
  return bubbles.map((item) => item.id === bubble.id
    ? {
      ...item,
      anchor: target.anchor,
      zIndex,
      flowRank: target.rank === 0 ? undefined : target.rank,
    }
    : item)
}

export function pageForAnchor(anchor: number, pages: PageSlice[]) {
  const index = pages.findIndex((page, pageIndex) => (
    anchor >= page.start && (anchor < page.end || pageIndex === pages.length - 1)
  ))
  return Math.max(1, index + 1)
}

export function pageForBlock(id: string, pages: PageSlice[]) {
  const index = pages.findIndex((page) => page.blockIds?.includes(id))
  return index < 0 ? 0 : index + 1
}

export function speechBubbleWidth(bubble: SpeechBubble, speakerName: string, hasAvatar: boolean) {
  const textSize = 2.9 * ((bubble.textScale ?? 100) / 100)
  const secondarySize = 2.1 * ((bubble.secondaryTextScale ?? 100) / 100)
  const nameWidth = bubble.showName === false ? 0 : longestLineUnits(speakerName) * 2.1
  const contentWidth = Math.max(
    12,
    longestLineUnits(bubble.text) * textSize,
    longestLineUnits(bubble.secondaryText) * secondarySize,
    nameWidth,
  )
  return Math.max(24, Math.min(88, contentWidth + 6.6 + (hasAvatar ? 11.7 : 0)))
}

export function resolveSpeechBubbleTops(items: VerticalLayoutItem[]) {
  const minTop = 2
  const ordered = [...items].sort((left, right) => left.y - right.y || left.zIndex - right.zIndex)
  const placed = ordered.reduce<Array<VerticalLayoutItem & { top: number }>>((result, item) => {
    const previous = result.at(-1)
    const top = Math.max(minTop, Math.min(90, item.y), previous ? previous.top + previous.height + DIALOGUE_LAYOUT_GAP : minTop)
    return [...result, { ...item, top }]
  }, [])
  const last = placed.at(-1)
  const overflow = last ? Math.max(0, last.top + last.height - DIALOGUE_LAYOUT_MAX_BOTTOM) : 0
  const availableShift = placed[0] ? Math.max(0, placed[0].top - minTop) : 0
  const shift = Math.min(overflow, availableShift)
  return Object.fromEntries(placed.map((item) => [item.id, item.top - shift]))
}

export function estimateSpeechBubbleHeight(bubble: SpeechBubble, profile: MemberProfile | undefined, options: BookOptions) {
  const hasAvatar = Boolean(profile?.avatar)
  const name = profile?.name ?? bubble.speakerName
  // Honour a manual width, matching what BookCanvas actually renders, so the
  // reserved height doesn't diverge from the real (narrower) card.
  const widthPercent = bubble.autoWidth === false ? bubble.width : speechBubbleWidth(bubble, name, hasAvatar)
  const width = options.pageWidth * (widthPercent / 100)
  const avatarWidth = hasAvatar ? options.pageWidth * 0.117 : 0
  const cardWidth = Math.max(options.pageWidth * 0.2, width - avatarWidth - options.pageWidth * 0.017)
  const horizontalPadding = options.pageWidth * 0.066
  const messageSize = options.pageWidth * 0.029 * ((bubble.textScale ?? 100) / 100)
  const secondarySize = options.pageWidth * 0.021 * ((bubble.secondaryTextScale ?? 100) / 100)
  const lineCount = (text: string, size: number) => text.split("\n").reduce((total, line) => {
    const units = Array.from(line).reduce((sum, character) => sum + (character === " " ? 0.36 : /[\x00-\x7F]/.test(character) ? 0.58 : 1), 0)
    return total + Math.max(1, Math.ceil((units * size) / Math.max(size * 4, cardWidth - horizontalPadding)))
  }, 0)
  const nameHeight = name && bubble.showName !== false ? options.pageWidth * 0.038 : 0
  const messageHeight = lineCount(bubble.text, messageSize) * messageSize * 1.35
  const secondaryHeight = bubble.secondaryText ? lineCount(bubble.secondaryText, secondarySize) * secondarySize * 1.35 + options.pageWidth * 0.012 : 0
  const cardHeight = Math.max(options.pageWidth * 0.1, options.pageWidth * 0.057 + nameHeight + messageHeight + secondaryHeight)
  // This is only a FALLBACK for bubbles not yet measured from the DOM. The old
  // blanket *1.25 over-reserved ~35% and pushed bubbles to the next page while
  // space remained; use the accurate per-part sum plus a small safety margin
  // (covers the card border and sub-pixel rounding) instead.
  return Math.max(cardHeight, hasAvatar ? options.pageWidth * 0.1 : 0) + options.pageWidth * 0.02
}

function longestLineUnits(text: string) {
  return Math.max(0, ...text.split("\n").map((line) => Array.from(line).reduce((width, character) => (
    width + (character === " " ? 0.36 : /[\x00-\x7F]/.test(character) ? 0.58 : 1)
  ), 0)))
}
