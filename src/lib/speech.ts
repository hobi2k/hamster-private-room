import type { SpeechBubble } from "../types"

type SpeechBubbleLayoutItem = Pick<SpeechBubble, "id" | "y" | "zIndex"> & {
  height: number
}

export function moveSpeechBubble(bubbles: SpeechBubble[], id: string, direction: -1 | 1) {
  const bubble = bubbles.find((item) => item.id === id)
  if (!bubble) return bubbles
  const ordered = bubbles
    .filter((item) => item.page === bubble.page)
    .sort((left, right) => left.y - right.y || left.zIndex - right.zIndex)
  const target = ordered[ordered.findIndex((item) => item.id === id) + direction]
  if (target && target.y !== bubble.y) {
    return bubbles.map((item) => item.id === bubble.id
      ? { ...item, y: target.y }
      : item.id === target.id ? { ...item, y: bubble.y } : item)
  }
  const y = Math.max(0, Math.min(90, Math.round((bubble.y + direction * 6) / 6) * 6))
  if (y === bubble.y) return bubbles
  return bubbles.map((item) => item.id === id ? { ...item, y } : item)
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

export function resolveSpeechBubbleTops(items: SpeechBubbleLayoutItem[]) {
  const minTop = 2
  const maxBottom = 96
  const gap = 1.2
  const ordered = [...items].sort((left, right) => left.y - right.y || left.zIndex - right.zIndex)
  const placed = ordered.reduce<Array<SpeechBubbleLayoutItem & { top: number }>>((result, item) => {
    const previous = result.at(-1)
    const top = Math.max(minTop, Math.min(90, item.y), previous ? previous.top + previous.height + gap : minTop)
    return [...result, { ...item, top }]
  }, [])
  const last = placed.at(-1)
  const overflow = last ? Math.max(0, last.top + last.height - maxBottom) : 0
  const availableShift = placed[0] ? Math.max(0, placed[0].top - minTop) : 0
  const shift = Math.min(overflow, availableShift)
  return Object.fromEntries(placed.map((item) => [item.id, item.top - shift]))
}

function longestLineUnits(text: string) {
  return Math.max(0, ...text.split("\n").map((line) => Array.from(line).reduce((width, character) => (
    width + (character === " " ? 0.36 : /[\x00-\x7F]/.test(character) ? 0.58 : 1)
  ), 0)))
}
