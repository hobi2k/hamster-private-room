import type { BookOptions, PageSlice, TextMark, TextSelection } from "../types"

export const PAGE_BREAK = "\f"

export type FlowBlock = {
  id: string
  anchor: number
  height: number
  minPage?: number
}

export function flowInsertionAnchor(page: PageSlice, selection: TextSelection | null, _isLastPage: boolean) {
  const offset = selection?.start
  if (
    offset !== undefined
    && offset >= page.start
    && offset <= page.end
  ) return offset
  return page.start
}

export function flowInsertionPage(selectedPage: number, page: PageSlice | undefined, anchor: number, pageCount: number) {
  if (selectedPage === 0) return 0
  return page && anchor >= page.end && selectedPage < pageCount ? selectedPage + 1 : selectedPage
}

export function paginateText(text: string, options: BookOptions, blocks: FlowBlock[] = []): PageSlice[] {
  let offset = 0
  const result: PageSlice[] = []
  text.split(PAGE_BREAK).forEach((section, index, sections) => {
    const pages = paginateSection(section, options, offset, blocks, result.length)
    result.push(...pages)
    offset += section.length + (index < sections.length - 1 ? PAGE_BREAK.length : 0)
  })
  return result
}

function paginateSection(text: string, options: BookOptions, offset: number, blocks: FlowBlock[], pageOffset: number): PageSlice[] {
  const contentWidth = Math.max(120, options.pageWidth - options.paddingX * 2)
  const pageHeight = Math.max(300, options.pageHeight)
  const lineHeight = options.fontSize * options.lineHeight
  const contentHeight = Math.max(160, pageHeight - options.paddingY - pageHeight * 0.11 - lineHeight * 1.1)
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
      const currentPage = pageOffset + slices.length + 1
      if (block && block.anchor <= offset + cursor && (!block.minPage || currentPage >= block.minPage)) {
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
  fontFamily?: string
  textDecoration?: string
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
  const userRanges: Array<{ start: number; end: number; style: TextStyle }> = marks.map((mark) => ({
    start: mark.start,
    end: mark.end,
    style:
      mark.kind === "highlight"
        ? { backgroundColor: mark.value }
        : mark.kind === "color"
          ? { color: mark.value }
        : mark.kind === "italic"
            ? { fontStyle: "italic" }
            : mark.kind === "underline"
              ? { textDecoration: "underline" }
              : mark.kind === "strike"
                ? { textDecoration: "line-through" }
            : mark.kind === "font"
              ? { fontFamily: mark.value }
              : mark.kind === "align"
                ? {} // paragraph alignment is applied on the block, not as inline text style
                : { fontWeight: 700 },
  }))

  const smartRanges: Array<{ start: number; end: number; style: TextStyle }> = []
  const smartDefs = [
    ...(options.smartBold ? [{ expression: /\*\*[^*]+\*\*/g, style: { fontWeight: 700 } }] : []),
    ...(options.smartAsterisk ? [{ expression: /(?<!\*)\*[^*]+\*(?!\*)/g, style: { color: options.asteriskItalic ? undefined : options.asteriskColor, fontStyle: options.asteriskItalic ? "italic" : undefined } }] : []),
    ...(options.smartQuote ? [{ expression: /"[^"]+"|“[^”]+”|‘[^’]+’/g, style: { color: options.quoteItalic ? undefined : options.quoteColor, fontStyle: options.quoteItalic ? "italic" : undefined } }] : []),
    ...(options.smartBracket ? [{ expression: /\([^)]*\)|\[[^\]]*\]/g, style: { color: options.bracketItalic ? undefined : options.bracketColor, fontStyle: options.bracketItalic ? "italic" : undefined } }] : []),
  ]
  smartDefs.forEach(({ expression, style }) => {
    Array.from(body.matchAll(expression)).forEach((match) => {
      const start = match.index ?? 0
      smartRanges.push({ start, end: start + match[0].length, style })
    })
  })

  // Smart (auto) styling first, explicit user marks last, so user marks win on
  // overlap. undefined style values must not clobber an underlying value.
  const ranges = [...smartRanges, ...userRanges]

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
      .reduce<TextStyle>((merged, range) => {
        const next = { ...merged }
        for (const key of Object.keys(range.style) as Array<keyof TextStyle>) {
          const value = range.style[key]
          if (value !== undefined) (next as Record<string, unknown>)[key] = value
        }
        return next
      }, {})
    return { text: body.slice(start, end), style }
  })
}
