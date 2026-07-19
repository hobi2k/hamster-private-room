import type { BookOptions, PageSlice, TextMark } from "../types"

const PAGE_RATIO = 1.414

export function paginateText(text: string, options: BookOptions): PageSlice[] {
  if (!text) return [{ text: "", start: 0, end: 0 }]
  const contentWidth = Math.max(120, options.pageWidth - options.paddingX * 2)
  const contentHeight = Math.max(160, options.pageWidth * PAGE_RATIO - options.paddingY * 2 - 42)
  const lineHeight = options.fontSize * options.lineHeight
  const lineUnits = contentWidth / (options.fontSize * options.scaleX)
  const pageUnits = Math.max(12, Math.floor(contentHeight / lineHeight) * lineUnits)
  const slices: PageSlice[] = []
  let start = 0
  let used = 0
  let lineUsed = 0

  Array.from(text).forEach((character, characterIndex) => {
    const unit = character === " " ? 0.36 : /[\x00-\x7F]/.test(character) ? 0.58 : 1
    if (character === "\n") {
      used += Math.max(1, lineUnits - lineUsed)
      lineUsed = 0
      if (text[characterIndex - 1] === "\n") used += options.paragraphSpacing / lineHeight * lineUnits
    } else {
      used += unit + Math.max(0, options.letterSpacing / options.fontSize)
      lineUsed += unit
      if (lineUsed >= lineUnits) lineUsed %= lineUnits
    }
    if (used < pageUnits || characterIndex === text.length - 1) return
    const naturalBreak = text.lastIndexOf("\n", characterIndex)
    const end = naturalBreak > start + (characterIndex - start) * 0.72 ? naturalBreak + 1 : characterIndex + 1
    slices.push({ text: text.slice(start, end), start, end })
    start = end
    used = Math.max(0, characterIndex + 1 - end)
    lineUsed = used
  })

  if (start < text.length) slices.push({ text: text.slice(start), start, end: text.length })
  return slices.length ? slices : [{ text: "", start: 0, end: 0 }]
}

type TextStyle = {
  color?: string
  backgroundColor?: string
  fontStyle?: string
  fontWeight?: number
}

export type DecoratedSlice = {
  text: string
  style: TextStyle
}

export function decoratePage(
  body: string,
  page: PageSlice,
  marks: TextMark[],
  options: BookOptions,
): DecoratedSlice[] {
  const ranges: Array<{ start: number; end: number; style: TextStyle }> = marks.map((mark) => ({
    start: mark.start,
    end: mark.end,
    style:
      mark.kind === "highlight"
        ? { backgroundColor: mark.value }
        : mark.kind === "color"
          ? { color: mark.value }
          : mark.kind === "italic"
            ? { fontStyle: "italic" }
            : { fontWeight: 700 },
  }))

  const smartRanges = [
    { expression: /["“][^"”]+["”]/g, style: { color: options.quoteColor, fontStyle: options.quoteItalic ? "italic" : undefined } },
    { expression: /\([^)]*\)|\[[^\]]*\]/g, style: { color: options.bracketColor, fontStyle: options.bracketItalic ? "italic" : undefined } },
  ]
  smartRanges.forEach(({ expression, style }) => {
    Array.from(body.matchAll(expression)).forEach((match) => {
      const start = match.index ?? 0
      ranges.push({ start, end: start + match[0].length, style })
    })
  })

  const boundaries = new Set([page.start, page.end])
  ranges.forEach((range) => {
    if (range.end <= page.start || range.start >= page.end) return
    boundaries.add(Math.max(page.start, range.start))
    boundaries.add(Math.min(page.end, range.end))
  })
  const sorted = Array.from(boundaries).sort((a, b) => a - b)
  return sorted.slice(0, -1).map((start, index) => {
    const end = sorted[index + 1]
    const style = ranges
      .filter((range) => range.start < end && range.end > start)
      .reduce<TextStyle>((merged, range) => ({ ...merged, ...range.style }), {})
    return { text: body.slice(start, end), style }
  })
}
