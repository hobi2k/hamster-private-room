import type { BookOptions, MemberProfile, PageSlice, SpeechBubble } from "../types"

type VerticalLayoutItem = {
  id: string
  y: number
  zIndex: number
  height: number
}

export const DIALOGUE_LAYOUT_GAP = 1.2
export const DIALOGUE_LAYOUT_MAX_BOTTOM = 94

export function moveSpeechBubble(bubbles: SpeechBubble[], id: string, direction: -1 | 1) {
  const bubble = bubbles.find((item) => item.id === id)
  if (!bubble) return bubbles
  const ordered = bubbles
    .filter((item) => (item.page === 0) === (bubble.page === 0))
    .sort((left, right) => left.anchor - right.anchor || left.zIndex - right.zIndex)
  const target = ordered[ordered.findIndex((item) => item.id === id) + direction]
  if (!target) return bubbles
  if (target.anchor !== bubble.anchor) {
    return bubbles.map((item) => item.id === bubble.id
      ? { ...item, anchor: target.anchor }
      : item.id === target.id ? { ...item, anchor: bubble.anchor } : item)
  }
  return bubbles.map((item) => item.id === bubble.id
    ? { ...item, zIndex: target.zIndex }
    : item.id === target.id ? { ...item, zIndex: bubble.zIndex } : item)
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
  return (Math.max(cardHeight, hasAvatar ? options.pageWidth * 0.1 : 0) + options.pageWidth * 0.026) * 1.25
}

function longestLineUnits(text: string) {
  return Math.max(0, ...text.split("\n").map((line) => Array.from(line).reduce((width, character) => (
    width + (character === " " ? 0.36 : /[\x00-\x7F]/.test(character) ? 0.58 : 1)
  ), 0)))
}
