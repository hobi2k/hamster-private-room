import { describe, expect, it } from "vitest"
import { normalizeColorMemory, rememberColor, togglePinnedColor } from "./colorMemory"

describe("color memory", () => {
  it("keeps the latest unique colors first", () => {
    const memory = rememberColor({ recent: ["#ffffff", "#ff0000"], pinned: [] }, "#FFFFFF")
    expect(memory.recent).toEqual(["#ffffff", "#ff0000"])
  })

  it("pins and unpins a color without duplicates", () => {
    const pinned = togglePinnedColor({ recent: [], pinned: [] }, "#ABCDEF")
    expect(pinned.pinned).toEqual(["#abcdef"])
    expect(togglePinnedColor(pinned, "#abcdef").pinned).toEqual([])
  })

  it("drops invalid values and caps persisted lists", () => {
    const memory = normalizeColorMemory({
      recent: ["bad", ...Array.from({ length: 12 }, (_, index) => `#0000${index.toString(16).padStart(2, "0")}`)],
      pinned: ["#112233", "#112233"],
    })
    expect(memory.recent).toHaveLength(8)
    expect(memory.pinned).toEqual(["#112233"])
  })
})
