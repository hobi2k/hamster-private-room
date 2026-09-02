import { describe, expect, it } from "vitest"
import {
  bytesToDataUrl,
  formatByteSize,
  gifAspectRatio,
  gifSizeVerdict,
  isAnimatedGifMeta,
  isGifBytes,
  isGifFile,
  isGifSource,
  readGifMeta,
} from "./gif"

function header(width: number, height: number, packed = 0) {
  return [
    ...[0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    width & 0xff, width >> 8,
    height & 0xff, height >> 8,
    packed, 0x00, 0x00,
  ]
}

// Graphic Control Extension: 0x21 0xF9, 4 data bytes (packed, delay lo/hi, transparent index), terminator.
function graphicControl(delayCentiseconds: number) {
  return [0x21, 0xf9, 0x04, 0x00, delayCentiseconds & 0xff, delayCentiseconds >> 8, 0x00, 0x00]
}

// Image Descriptor + LZW code size + one empty sub-block run.
function imageBlock(localTableBits = 0) {
  const packed = localTableBits ? 0x80 | (localTableBits - 1) : 0x00
  const table = localTableBits ? new Array(3 * (1 << localTableBits)).fill(0) : []
  return [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, packed, ...table, 0x02, 0x01, 0x00, 0x00]
}

function gif(...blocks: number[][]) {
  return new Uint8Array([...header(48, 24), ...blocks.flat(), 0x3b])
}

describe("GIF signature detection", () => {
  it("recognizes both GIF header versions and rejects other bytes", () => {
    expect(isGifBytes(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe(true)
    expect(isGifBytes(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]))).toBe(true)
    expect(isGifBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe(false)
    expect(isGifBytes(new Uint8Array([0x47, 0x49, 0x46]))).toBe(false)
  })

  it("reads the MIME type first and falls back to the extension", () => {
    expect(isGifFile({ type: "image/gif", name: "a.png" })).toBe(true)
    expect(isGifFile({ type: "image/webp", name: "a.gif" })).toBe(false)
    expect(isGifFile({ name: "dance.GIF" })).toBe(true)
    expect(isGifFile({ name: "dance.webp" })).toBe(false)
  })

  it("detects GIF sources by data URL or file extension", () => {
    expect(isGifSource("data:image/gif;base64,R0lGOD")).toBe(true)
    expect(isGifSource("data:image/webp;base64,R0lGOD")).toBe(false)
    expect(isGifSource("/assets/dance.gif?v=2")).toBe(true)
    expect(isGifSource("/assets/dance.webp")).toBe(false)
  })
})

describe("GIF block scanning", () => {
  it("counts frames and sums per-frame delays", () => {
    const meta = readGifMeta(gif(graphicControl(8), imageBlock(), graphicControl(12), imageBlock()))
    expect(meta).toEqual({ width: 48, height: 24, frameCount: 2, duration: 200 })
  })

  it("treats a zero delay as the browser default so duration stays usable", () => {
    expect(readGifMeta(gif(graphicControl(0), imageBlock()))?.duration).toBe(100)
  })

  it("skips local color tables to stay aligned across frames", () => {
    expect(readGifMeta(gif(imageBlock(4), imageBlock(2), imageBlock()))?.frameCount).toBe(3)
  })

  it("returns null for non-GIF and frameless data", () => {
    expect(readGifMeta(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull()
    expect(readGifMeta(gif())).toBeNull()
  })

  it("separates a still GIF from an animated one", () => {
    expect(isAnimatedGifMeta(readGifMeta(gif(imageBlock())))).toBe(false)
    expect(isAnimatedGifMeta(readGifMeta(gif(imageBlock(), imageBlock())))).toBe(true)
    expect(isAnimatedGifMeta(null)).toBe(false)
  })

  it("derives the aspect ratio from the logical screen size", () => {
    expect(gifAspectRatio(readGifMeta(gif(imageBlock())))).toBe(2)
    expect(gifAspectRatio(null)).toBe(1)
    expect(gifAspectRatio({ width: 0, height: 10, frameCount: 2, duration: 200 })).toBe(1)
  })
})

describe("GIF size guards", () => {
  it("warns before the storage quota and refuses unpersistable clips", () => {
    expect(gifSizeVerdict(400_000)).toBe("ok")
    expect(gifSizeVerdict(2_000_000)).toBe("warn")
    expect(gifSizeVerdict(20_000_000)).toBe("reject")
  })

  it("formats sizes for the toast copy", () => {
    expect(formatByteSize(240_000)).toBe("240KB")
    expect(formatByteSize(2_450_000)).toBe("2.5MB")
    expect(formatByteSize(120)).toBe("1KB")
  })
})

describe("data URL encoding", () => {
  it("keeps the GIF MIME type and survives chunk-boundary payloads", () => {
    const url = bytesToDataUrl(gif(imageBlock()))
    expect(url.startsWith("data:image/gif;base64,")).toBe(true)
    const large = new Uint8Array(0x8000 * 2 + 5).fill(0x41)
    expect(atob(bytesToDataUrl(large).split(",")[1]).length).toBe(large.length)
  })
})
