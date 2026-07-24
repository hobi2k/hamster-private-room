import { describe, expect, it } from "vitest"
import type { TextMark } from "../types"
import { applyFontMark, diffRange, segmentOwnsCaret, splitBoundaryNewlines } from "./text"

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

describe("splitBoundaryNewlines", () => {
  it("keeps the structural leading newline separate from a user newline", () => {
    expect(splitBoundaryNewlines("\n\n다음 문단", true, false)).toEqual({
      lead: "\n",
      content: "\n다음 문단",
      trail: "",
    })
  })

  it("protects both alignment boundaries without losing logical newlines", () => {
    const parts = splitBoundaryNewlines("\n\n\n", true, true)
    expect(parts).toEqual({ lead: "\n", content: "\n", trail: "\n" })
    expect(`${parts.lead}${parts.content}${parts.trail}`).toBe("\n\n\n")
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

describe("segmentOwnsCaret", () => {
  it("gives a shared alignment boundary to the preceding segment only", () => {
    expect(segmentOwnsCaret(0, 5, 5, true)).toBe(true)
    expect(segmentOwnsCaret(5, 10, 5, false)).toBe(false)
  })

  it("keeps real block-boundary start and end offsets restorable", () => {
    expect(segmentOwnsCaret(10, 20, 10, true)).toBe(true)
    expect(segmentOwnsCaret(10, 20, 20, true)).toBe(true)
  })
})
