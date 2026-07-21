import type { BookOptions, PageSlice, TextMark } from "../types"

const PAGE_RATIO = 1.414
export const PAGE_BREAK = "\f"

export function paginateText(text: string, options: BookOptions): PageSlice[] {
  let offset = 0
  return text.split(PAGE_BREAK).flatMap((section, index, sections) => {
    const pages = paginateSection(section, options, offset)
    offset += section.length + (index < sections.length - 1 ? PAGE_BREAK.length : 0)
    return pages
  })
}

function paginateSection(text: string, options: BookOptions, offset: number): PageSlice[] {
  if (!text) return [{ text: "", start: offset, end: offset }]
  const contentWidth = Math.max(120, options.pageWidth - options.paddingX * 2)
  const pageHeight = options.pageWidth * PAGE_RATIO
  const contentHeight = Math.max(160, pageHeight - options.paddingY - pageHeight * 0.11)
  const lineHeight = options.fontSize * options.lineHeight
  const lineUnits = Math.max(6, contentWidth / (options.fontSize * options.scaleX))
  const slices: PageSlice[] = []
  let start = 0

  while (start < text.length) {
    let height = lineHeight
    let lineUsed = 0
    let lastBreak = start
    let index = start

    while (index < text.length) {
      const character = text[index]
      const paragraphBreak = character === "\n" && text[index + 1] === "\n"
      const nextHeight = paragraphBreak
        ? height + lineHeight + options.paragraphSpacing
        : character === "\n"
          ? height + lineHeight
          : lineUsed + characterUnits(character, options) > lineUnits
            ? height + lineHeight
            : height
      if (nextHeight > contentHeight) break

      height = nextHeight
      if (paragraphBreak) {
        lineUsed = 0
        index += 2
        lastBreak = index
        continue
      }
      if (character === "\n") {
        lineUsed = 0
        index += 1
        lastBreak = index
        continue
      }

      const unit = characterUnits(character, options)
      lineUsed = lineUsed + unit > lineUnits ? unit : lineUsed + unit
      index += 1
      if (/\s/.test(character)) {
        lastBreak = index
      }
    }

    if (index >= text.length) {
      slices.push({ text: text.slice(start), start: offset + start, end: offset + text.length })
      break
    }
    const end = lastBreak > start && index - lastBreak <= 2 ? lastBreak : Math.max(start + 1, index)
    slices.push({ text: text.slice(start, end), start: offset + start, end: offset + end })
    start = end
  }

  return slices.length ? slices : [{ text: "", start: offset, end: offset }]
}

function characterUnits(character: string, options: BookOptions) {
  const base = character === " " ? 0.36 : /[\x00-\x7F]/.test(character) ? 0.58 : 1
  return base + Math.max(0, options.letterSpacing / options.fontSize)
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
    { expression: /"[^"]+"|“[^”]+”|‘[^’]+’/g, style: { color: options.quoteColor, fontStyle: options.quoteItalic ? "italic" : undefined } },
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
