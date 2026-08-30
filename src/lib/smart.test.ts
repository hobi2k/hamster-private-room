import { describe, expect, it } from "vitest"
import { DEFAULT_OPTIONS } from "../data/themes"
import { consumeSmartSyntax } from "./smart"

describe("consumeSmartSyntax", () => {
  it("removes completed double-asterisk markers and records a bold range", () => {
    const result = consumeSmartSyntax("앞 **굵게** 뒤", DEFAULT_OPTIONS)
    expect(result.text).toBe("앞 굵게 뒤")
    expect(result.marks).toEqual([{ start: 2, end: 4, kind: "bold", value: "700", source: "smart-bold" }])
    expect(result.mapOffset("앞 **굵게** 뒤".length)).toBe(result.text.length)
  })

  it("uses the configured style for a single-asterisk range", () => {
    const result = consumeSmartSyntax("*강조*", {
      ...DEFAULT_OPTIONS,
      smartAsterisk: true,
      asteriskItalic: false,
      asteriskColor: "#123456",
    })
    expect(result.text).toBe("강조")
    expect(result.marks).toEqual([{ start: 0, end: 2, kind: "color", value: "#123456", source: "smart-asterisk" }])
  })

  it("leaves incomplete markers untouched", () => {
    expect(consumeSmartSyntax("**아직", DEFAULT_OPTIONS).text).toBe("**아직")
  })
})
