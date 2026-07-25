import { describe, expect, it } from "vitest"
import type { TextMark } from "../types"
import { adjacentDeletionRange, applyAlignmentMark, applyFontMark, diffRange, paragraphSelectionRange, segmentOwnsCaret } from "./text"

describe("diffRange", () => {
  it("finds an insertion in the middle", () => {
    expect(diffRange("abcdef", "abcXdef")).toEqual({ prefix: 3, suffix: 3 })
  })

  it("finds a deletion in the middle", () => {
    expect(diffRange("abcXdef", "abcdef")).toEqual({ prefix: 3, suffix: 3 })
  })

  it("handles an append at the end", () => {
    expect(diffRange("abc", "abcd")).toEqual({ prefix: 3, suffix: 0 })
  })

  it("handles a prepend at the start", () => {
    expect(diffRange("abc", "Xabc")).toEqual({ prefix: 0, suffix: 3 })
  })

  it("treats identical text as an empty change span", () => {
    expect(diffRange("abc", "abc")).toEqual({ prefix: 3, suffix: 0 })
  })

  it("handles a full replacement", () => {
    expect(diffRange("abc", "xyz")).toEqual({ prefix: 0, suffix: 0 })
  })

  it("reconstructs next from previous using the reported span", () => {
    const previous = "한 문장을 여기에 적는다."
    const next = "한 문장을 조용히 여기에 적는다."
    const { prefix, suffix } = diffRange(previous, next)
    const rebuilt = previous.slice(0, prefix) + next.slice(prefix, next.length - suffix) + previous.slice(previous.length - suffix)
    expect(rebuilt).toBe(next)
  })
})

describe("paragraphSelectionRange", () => {
  const body = "첫 줄\n번역 줄\n\n다음 문단\n둘째 줄"

  it("treats a single newline as a line break inside one paragraph", () => {
    expect(paragraphSelectionRange(body, 1, 3)).toEqual({ start: 0, end: 8 })
  })

  it("expands a cross-paragraph selection through the last selected paragraph", () => {
    expect(paragraphSelectionRange(body, 2, body.length)).toEqual({ start: 0, end: body.length })
  })

  it("does not include the next paragraph when trailing newlines are selected", () => {
    expect(paragraphSelectionRange(body, 0, 10)).toEqual({ start: 0, end: 8 })
  })
})

describe("adjacentDeletionRange", () => {
  it("deletes the character before an automatic page boundary", () => {
    expect(adjacentDeletionRange("12345678901234567890", 10, 20, 10, "backward"))
      .toEqual({ start: 9, end: 10, caret: 9 })
  })

  it("deletes a manual page-break sentinel immediately before a page", () => {
    const body = "앞쪽\f뒤쪽"
    const pageStart = body.indexOf("\f") + 1
    expect(adjacentDeletionRange(body, pageStart, body.length, pageStart, "backward"))
      .toEqual({ start: pageStart - 1, end: pageStart, caret: pageStart - 1 })
  })

  it("deletes a line break whose caret anchor has no visible text", () => {
    const body = "앞줄\n뒷줄"
    expect(adjacentDeletionRange(body, 0, body.length, 3, "backward"))
      .toEqual({ start: 2, end: 3, caret: 2 })
    expect(adjacentDeletionRange(body, 0, body.length, 2, "forward"))
      .toEqual({ start: 2, end: 3, caret: 2 })
  })

  it("does nothing away from a segment boundary", () => {
    expect(adjacentDeletionRange("12345678901234567890", 10, 20, 14, "backward")).toBeNull()
    expect(adjacentDeletionRange("12345678901234567890", 10, 20, 14, "forward")).toBeNull()
  })
})

describe("applyFontMark", () => {
  const fontMark = (patch: Partial<TextMark> = {}): TextMark => ({
    id: "font",
    start: 2,
    end: 12,
    kind: "font",
    value: "Old Font",
    ...patch,
  })

  it("splits a covering font mark when a sub-range is reset", () => {
    const marks = applyFontMark([fontMark()], 5, 8, "", () => "right")
    expect(marks).toEqual([
      fontMark({ end: 5 }),
      fontMark({ id: "right", start: 8 }),
    ])
  })

  it("replaces only the selected part and leaves other mark kinds unchanged", () => {
    const bold = fontMark({ id: "bold", kind: "bold", value: "700" })
    let id = 0
    const marks = applyFontMark([fontMark(), bold], 5, 8, "New Font", () => `new-${id += 1}`)
    expect(marks).toEqual([
      fontMark({ end: 5 }),
      fontMark({ id: "new-1", start: 8 }),
      bold,
      fontMark({ id: "new-2", start: 5, end: 8, value: "New Font" }),
    ])
  })
})

describe("applyAlignmentMark", () => {
  const alignment = (patch: Partial<TextMark> = {}): TextMark => ({
    id: "align",
    start: 0,
    end: 30,
    kind: "align",
    value: "center",
    ...patch,
  })

  it("changes only the selected paragraph inside a larger aligned range", () => {
    let id = 0
    expect(applyAlignmentMark([alignment()], 10, 20, "right", () => `new-${id += 1}`)).toEqual([
      alignment({ end: 10 }),
      alignment({ id: "new-1", start: 20 }),
      alignment({ id: "new-2", start: 10, end: 20, value: "right" }),
    ])
  })

  it("left alignment removes only the selected paragraph mark", () => {
    expect(applyAlignmentMark([alignment()], 10, 20, "left", () => "right-piece")).toEqual([
      alignment({ end: 10 }),
      alignment({ id: "right-piece", start: 20 }),
    ])
  })

  it("leaves unrelated text marks and paragraphs unchanged", () => {
    const bold = alignment({ id: "bold", start: 2, end: 5, kind: "bold", value: "700" })
    const other = alignment({ id: "other", start: 40, end: 50, value: "justify" })
    expect(applyAlignmentMark([bold, other], 10, 20, "center", () => "new")).toEqual([
      bold,
      other,
      alignment({ id: "new", start: 10, end: 20 }),
    ])
  })
})

describe("segmentOwnsCaret", () => {
  it("gives a shared page boundary to the following segment", () => {
    expect(segmentOwnsCaret(0, 5, 10, 5)).toBe(false)
    expect(segmentOwnsCaret(5, 10, 10, 5)).toBe(true)
  })

  it("keeps the final document offset restorable", () => {
    expect(segmentOwnsCaret(10, 20, 20, 10)).toBe(true)
    expect(segmentOwnsCaret(10, 20, 20, 20)).toBe(true)
  })
})
