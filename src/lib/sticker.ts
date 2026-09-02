import type { StickerLayer } from "../types"
import { isGifSource } from "./gif"

export const STICKER_MIN_SIZE = 24
export const STICKER_MAX_SIZE = 480
export const STICKER_DEFAULT_SIZE = 64

export function clampStickerSize(size: number) {
  if (!Number.isFinite(size)) return STICKER_DEFAULT_SIZE
  return Math.max(STICKER_MIN_SIZE, Math.min(STICKER_MAX_SIZE, size))
}

export function clampStickerOpacity(opacity: number) {
  if (!Number.isFinite(opacity)) return 1
  return Math.max(0, Math.min(1, opacity))
}

export function safeAspectRatio(aspectRatio?: number) {
  return Number.isFinite(aspectRatio) && (aspectRatio as number) > 0 ? (aspectRatio as number) : 1
}

// `size` is the sticker's longest edge, so a wide GIF keeps its width and a
// tall one keeps its height. Without this both edges got `size` and every
// non-square clip sat letterboxed inside an oversized, mis-aligned hit box.
export function stickerBox(size: number, aspectRatio?: number) {
  const ratio = safeAspectRatio(aspectRatio)
  const edge = clampStickerSize(size)
  return ratio >= 1
    ? { width: edge, height: edge / ratio }
    : { width: edge * ratio, height: edge }
}

export function isAnimatedSticker(sticker: Pick<StickerLayer, "animated" | "src">) {
  return Boolean(sticker.animated ?? (sticker.src ? isGifSource(sticker.src) : false))
}

export function normalizeSticker(sticker: Partial<StickerLayer>, index: number): StickerLayer {
  const src = typeof sticker.src === "string" ? sticker.src : undefined
  return {
    ...sticker,
    id: sticker.id || crypto.randomUUID(),
    kind: sticker.kind ?? (src ? "custom" : "heart"),
    src,
    name: sticker.name ?? "sticker",
    page: Number.isFinite(sticker.page) ? Math.max(0, sticker.page!) : 1,
    x: Number.isFinite(sticker.x) ? Math.max(0, Math.min(100, sticker.x!)) : 50,
    y: Number.isFinite(sticker.y) ? Math.max(0, Math.min(100, sticker.y!)) : 48,
    size: Number.isFinite(sticker.size) ? clampStickerSize(sticker.size!) : 56,
    aspectRatio: Number.isFinite(sticker.aspectRatio) && sticker.aspectRatio! > 0 ? sticker.aspectRatio : undefined,
    // Documents saved before opacity existed have to read as fully opaque
    // rather than collapsing to 0 through the clamp.
    opacity: Number.isFinite(sticker.opacity) ? clampStickerOpacity(sticker.opacity!) : 1,
    animated: Boolean(sticker.animated ?? (src ? isGifSource(src) : false)),
    rotation: Number.isFinite(sticker.rotation) ? sticker.rotation! : 0,
    flipped: Boolean(sticker.flipped),
    color: sticker.color || "#ffd23f",
    zIndex: Number.isFinite(sticker.zIndex) ? sticker.zIndex! : index + 1,
  }
}
