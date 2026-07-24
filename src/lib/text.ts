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

export function segmentOwnsCaret(start: number, end: number, offset: number, leadingSegment: boolean) {
  if (offset < start || offset > end) return false
  return leadingSegment || offset > start
}
