import { describe, expect, it } from "vitest"
import { frameIndexAt, gifTimeline } from "./animatedGif"

describe("animated GIF timeline", () => {
  it("selects a source frame by cumulative delay and loops", () => {
    expect(frameIndexAt(0, [100, 200, 100])).toBe(0)
    expect(frameIndexAt(150, [100, 200, 100])).toBe(1)
    expect(frameIndexAt(350, [100, 200, 100])).toBe(2)
    expect(frameIndexAt(450, [100, 200, 100])).toBe(0)
  })

  it("caps long animations and samples at a stable interval", () => {
    expect(gifTimeline([9000])).toHaveLength(40)
    expect(gifTimeline([250])).toEqual([0, 125])
  })
})
