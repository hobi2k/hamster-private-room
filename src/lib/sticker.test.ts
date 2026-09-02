import { describe, expect, it } from "vitest"
import type { StickerLayer } from "../types"
import {
  STICKER_MAX_SIZE,
  STICKER_MIN_SIZE,
  clampStickerOpacity,
  clampStickerSize,
  isAnimatedSticker,
  normalizeSticker,
  stickerBox,
} from "./sticker"

describe("sticker bounds", () => {
  it("clamps the size to the resizable range and repairs NaN", () => {
    expect(clampStickerSize(120)).toBe(120)
    expect(clampStickerSize(4)).toBe(STICKER_MIN_SIZE)
    expect(clampStickerSize(9000)).toBe(STICKER_MAX_SIZE)
    expect(clampStickerSize(Number.NaN)).toBe(64)
  })

  it("clamps opacity to 0..1", () => {
    expect(clampStickerOpacity(0.4)).toBe(0.4)
    expect(clampStickerOpacity(-2)).toBe(0)
    expect(clampStickerOpacity(3)).toBe(1)
    expect(clampStickerOpacity(Number.NaN)).toBe(1)
  })
})

describe("sticker box", () => {
  it("treats size as the longest edge so wide and tall clips keep proportions", () => {
    expect(stickerBox(100, 2)).toEqual({ width: 100, height: 50 })
    expect(stickerBox(100, 0.5)).toEqual({ width: 50, height: 100 })
    expect(stickerBox(100, 1)).toEqual({ width: 100, height: 100 })
  })

  it("falls back to a square for a missing or nonsense ratio", () => {
    expect(stickerBox(80)).toEqual({ width: 80, height: 80 })
    expect(stickerBox(80, 0)).toEqual({ width: 80, height: 80 })
    expect(stickerBox(80, Number.NaN)).toEqual({ width: 80, height: 80 })
  })

  it("clamps the incoming size before measuring", () => {
    expect(stickerBox(9000, 2)).toEqual({ width: STICKER_MAX_SIZE, height: STICKER_MAX_SIZE / 2 })
  })
})

describe("animated sticker detection", () => {
  it("trusts the stored flag and otherwise sniffs the source", () => {
    expect(isAnimatedSticker({ animated: true, src: "data:image/webp;base64,x" })).toBe(true)
    expect(isAnimatedSticker({ animated: false, src: "data:image/gif;base64,x" })).toBe(false)
    expect(isAnimatedSticker({ src: "data:image/gif;base64,x" })).toBe(true)
    expect(isAnimatedSticker({ src: "data:image/png;base64,x" })).toBe(false)
    expect(isAnimatedSticker({})).toBe(false)
  })
})

describe("sticker normalization", () => {
  const base: Partial<StickerLayer> = { id: "s1", kind: "heart", name: "하트", page: 2 }

  it("keeps documents saved before opacity existed fully opaque", () => {
    expect(normalizeSticker(base, 0).opacity).toBe(1)
    expect(normalizeSticker({ ...base, opacity: 0 }, 0).opacity).toBe(0)
    expect(normalizeSticker({ ...base, opacity: 0.35 }, 0).opacity).toBe(0.35)
  })

  it("infers the animated flag from a legacy GIF source", () => {
    expect(normalizeSticker({ ...base, kind: "custom", src: "data:image/gif;base64,x" }, 0).animated).toBe(true)
    expect(normalizeSticker({ ...base, kind: "custom", src: "data:image/png;base64,x" }, 0).animated).toBe(false)
  })

  it("repairs malformed geometry instead of feeding NaN to sliders", () => {
    const sticker = normalizeSticker({ ...base, x: 900, y: Number.NaN, size: 9000, rotation: undefined }, 3)
    expect(sticker.x).toBe(100)
    expect(sticker.y).toBe(48)
    expect(sticker.size).toBe(STICKER_MAX_SIZE)
    expect(sticker.rotation).toBe(0)
    expect(sticker.zIndex).toBe(4)
  })

  it("drops a non-positive aspect ratio so the box falls back to square", () => {
    expect(normalizeSticker({ ...base, aspectRatio: 0 }, 0).aspectRatio).toBeUndefined()
    expect(normalizeSticker({ ...base, aspectRatio: 1.5 }, 0).aspectRatio).toBe(1.5)
  })
})
