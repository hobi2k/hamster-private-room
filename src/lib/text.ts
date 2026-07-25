import type { TextMark } from "../types"

// Minimal common-prefix/suffix diff between two strings. Used so a contentEditable
// edit only replaces the span that actually changed, preserving marks and blocks
// outside it (rather than rewriting the whole segment on every keystroke).
export function diffRange(previous: string, next: string): { prefix: number; suffix: number } {
  let prefix = 0
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) prefix += 1
  let suffix = 0
  while (
    suffix < previous.length - prefix
    && suffix < next.length - prefix
    && previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) suffix += 1
  return { prefix, suffix }
}

export function paragraphSelectionRange(text: string, start: number, end: number) {
  const rangeStart = Math.max(0, Math.min(start, end))
  const rangeEnd = Math.min(text.length, Math.max(start, end))
  let contentEnd = rangeEnd
  while (contentEnd > rangeStart && text[contentEnd - 1] === "\n") contentEnd -= 1
  const previousBreak = text.lastIndexOf("\n\n", Math.max(0, rangeStart - 1))
  const nextBreak = text.indexOf("\n\n", Math.max(rangeStart, contentEnd - 1))
  return {
    start: previousBreak === -1 ? 0 : previousBreak + 2,
    end: nextBreak === -1 ? text.length : nextBreak,
  }
}

export function adjacentDeletionRange(
  body: string,
  start: number,
  end: number,
  caret: number,
  direction: "backward" | "forward",
) {
  if (
    direction === "backward"
    && caret > 0
    && (caret === start || body[caret - 1] === "\n" || body[caret - 1] === "\f")
  ) {
    return { start: caret - 1, end: caret, caret: caret - 1 }
  }
  if (
    direction === "forward"
    && caret < body.length
    && (caret === end || body[caret] === "\n" || body[caret] === "\f")
  ) {
    return { start: caret, end: caret + 1, caret }
  }
  return null
}

export function applyFontMark(
  marks: TextMark[],
  start: number,
  end: number,
  value: string,
  createId: () => string = () => crypto.randomUUID(),
) {
  const retained = marks.flatMap((mark) => {
    if (mark.kind !== "font" || mark.end <= start || mark.start >= end) return [mark]
    const parts: TextMark[] = []
    if (mark.start < start) parts.push({ ...mark, end: start })
    if (mark.end > end) {
      parts.push({
        ...mark,
        id: parts.length ? createId() : mark.id,
        start: end,
      })
    }
    return parts
  })
  return value
    ? [...retained, { id: createId(), start, end, kind: "font" as const, value }]
    : retained
}

export function applyAlignmentMark(
  marks: TextMark[],
  start: number,
  end: number,
  value: string,
  createId: () => string = () => crypto.randomUUID(),
) {
  const retained = marks.flatMap((mark) => {
    if (mark.kind !== "align" || mark.end <= start || mark.start >= end) return [mark]
    const parts: TextMark[] = []
    if (mark.start < start) parts.push({ ...mark, end: start })
    if (mark.end > end) {
      parts.push({
        ...mark,
        id: parts.length ? createId() : mark.id,
        start: end,
      })
    }
    return parts
  })
  return value === "left" || start >= end
    ? retained
    : [...retained, { id: createId(), start, end, kind: "align" as const, value }]
}

export function segmentOwnsCaret(start: number, end: number, bodyLength: number, offset: number) {
  if (offset < start || offset > end) return false
  if (offset === end) return end === bodyLength
  return true
}
