import type { BookOptions, PageSlice, TextMark } from "../types"

const PAGE_RATIO = 1.414
export const PAGE_BREAK = "\f"

export type FlowBlock = {
  id: string
  anchor: number
  height: number
}

export function paginateText(text: string, options: BookOptions, blocks: FlowBlock[] = []): PageSlice[] {
  let offset = 0
  return text.split(PAGE_BREAK).flatMap((section, index, sections) => {
    const pages = paginateSection(section, options, offset, blocks)
    offset += section.length + (index < sections.length - 1 ? PAGE_BREAK.length : 0)
    return pages
  })
}

function paginateSection(text: string, options: BookOptions, offset: number, blocks: FlowBlock[]): PageSlice[] {
  const contentWidth = Math.max(120, options.pageWidth - options.paddingX * 2)
  const pageHeight = options.pageWidth * PAGE_RATIO
  const contentHeight = Math.max(160, pageHeight - options.paddingY - pageHeight * 0.11)
  const lineHeight = options.fontSize * options.lineHeight
  const lineUnits = Math.max(6, contentWidth / (options.fontSize * options.scaleX))
  const sectionBlocks = blocks
    .filter((block) => block.anchor >= offset && block.anchor <= offset + text.length)
    .sort((left, right) => left.anchor - right.anchor)
  const slices: PageSlice[] = []
  let cursor = 0
  let blockIndex = 0

  while (cursor < text.length || blockIndex < sectionBlocks.length || slices.length === 0) {
    const start = cursor
    const blockIds: string[] = []
    let height = 0
    let lineUsed = 0
    let hasLine = false
    let consumed = false

    while (cursor < text.length || blockIndex < sectionBlocks.length) {
      const block = sectionBlocks[blockIndex]
      if (block && block.anchor <= offset + cursor) {
        if (height + block.height > contentHeight && consumed) break
        height += block.height
        blockIds.push(block.id)
        blockIndex += 1
        consumed = true
        lineUsed = 0
        hasLine = false
        continue
      }

      if (cursor >= text.length) break
      const character = text[cursor]
      const paragraphBreak = character === "\n" && text[cursor + 1] === "\n"
      const nextHeight = paragraphBreak
        ? height + lineHeight + options.paragraphSpacing
        : character === "\n"
          ? height + lineHeight
          : lineUsed + characterUnits(character, options) > lineUnits
            ? height + lineHeight
            : height + (hasLine ? 0 : lineHeight)
      if (nextHeight > contentHeight && consumed) break

      height = nextHeight
      consumed = true
      hasLine = true
      if (paragraphBreak) {
        lineUsed = 0
        cursor += 2
        continue
      }
      if (character === "\n") {
        lineUsed = 0
        cursor += 1
        continue
      }

      const unit = characterUnits(character, options)
      lineUsed = lineUsed + unit > lineUnits ? unit : lineUsed + unit
      cursor += 1
    }

    slices.push({ text: text.slice(start, cursor), start: offset + start, end: offset + cursor, blockIds })
    if (!consumed) break
  }

  return slices
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
