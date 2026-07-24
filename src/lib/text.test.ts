import { describe, expect, it } from "vitest"
import { diffRange } from "./text"

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
