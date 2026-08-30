import { describe, expect, it } from "vitest"
import { pageHeightForPreset } from "./page"

describe("pageHeightForPreset", () => {
  it("keeps a custom height and calculates standard paper ratios", () => {
    expect(pageHeightForPreset("custom", 620, 840)).toBe(840)
    expect(pageHeightForPreset("a4", 620, 840)).toBe(Math.round(620 * 210 / 148))
    expect(pageHeightForPreset("b6", 400, 840)).toBe(Math.round(400 * 182 / 128))
  })
})
