export type GifMeta = {
  width: number
  height: number
  frameCount: number
  duration: number
}

export type GifAsset = {
  src: string
  meta: GifMeta | null
}

// A single autosave slot has to fit in localStorage next to the manuscript, so
// warn well before the quota and refuse clips that can never be persisted.
export const GIF_WARN_BYTES = 1_500_000
export const GIF_MAX_BYTES = 12_000_000

export type GifSizeVerdict = "ok" | "warn" | "reject"

export function gifSizeVerdict(size: number): GifSizeVerdict {
  if (size > GIF_MAX_BYTES) return "reject"
  if (size > GIF_WARN_BYTES) return "warn"
  return "ok"
}

export function formatByteSize(size: number) {
  if (size >= 1_000_000) return `${Math.round(size / 100_000) / 10}MB`
  return `${Math.max(1, Math.round(size / 1000))}KB`
}

export function isGifBytes(bytes: Uint8Array) {
  if (bytes.length < 6) return false
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5])
  return header === "GIF87a" || header === "GIF89a"
}

export function isGifFile(file: { type?: string; name?: string }) {
  if (file.type) return file.type.toLowerCase() === "image/gif"
  return /\.gif$/i.test(file.name ?? "")
}

export function isGifSource(value: string) {
  return /^data:image\/gif(?:;|,)/i.test(value) || /\.gif(?:$|[?#])/i.test(value)
}

// GIF sub-blocks are length-prefixed chunks closed by a zero-length block.
function skipSubBlocks(bytes: Uint8Array, start: number) {
  let cursor = start
  while (cursor < bytes.length) {
    const size = bytes[cursor]
    if (!size) return cursor + 1
    cursor += size + 1
  }
  return bytes.length
}

function colorTableSize(packed: number) {
  return packed & 0x80 ? 3 * (1 << ((packed & 0x07) + 1)) : 0
}

// Walk the block stream instead of decoding pixels: we only need the canvas
// size and how many image descriptors (frames) the file carries, and that
// answers "is this actually animated?" without paying for a full decode.
export function readGifMeta(bytes: Uint8Array): GifMeta | null {
  if (!isGifBytes(bytes) || bytes.length < 13) return null
  const width = bytes[6] | (bytes[7] << 8)
  const height = bytes[8] | (bytes[9] << 8)
  let cursor = 13 + colorTableSize(bytes[10])
  let frameCount = 0
  let duration = 0
  let pendingDelay = 0
  while (cursor < bytes.length) {
    const block = bytes[cursor]
    if (block === 0x3b) break
    if (block === 0x21) {
      const label = bytes[cursor + 1]
      cursor += 2
      // Graphic Control Extension carries this frame's delay in 1/100 s.
      if (label === 0xf9 && bytes[cursor] >= 4) {
        pendingDelay = (bytes[cursor + 2] | (bytes[cursor + 3] << 8)) * 10
      }
      cursor = skipSubBlocks(bytes, cursor)
      continue
    }
    if (block === 0x2c) {
      frameCount += 1
      // Browsers treat a 0 delay as ~100ms, so mirror that for the estimate.
      duration += pendingDelay > 0 ? pendingDelay : 100
      pendingDelay = 0
      const packed = bytes[cursor + 9]
      cursor += 10 + colorTableSize(packed) + 1
      cursor = skipSubBlocks(bytes, cursor)
      continue
    }
    break
  }
  if (!frameCount) return null
  return { width, height, frameCount, duration }
}

export function isAnimatedGifMeta(meta: GifMeta | null) {
  return Boolean(meta && meta.frameCount > 1)
}

export function gifAspectRatio(meta: GifMeta | null) {
  if (!meta || meta.width <= 0 || meta.height <= 0) return 1
  return meta.width / meta.height
}

// btoa on a whole multi-megabyte clip blows the argument limit, so fold it in
// chunks. This is the only way to keep the original animated bytes intact —
// any canvas round trip would flatten the clip to its first frame.
export function bytesToDataUrl(bytes: Uint8Array, mime = "image/gif") {
  const chunk = 0x8000
  let binary = ""
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return `data:${mime};base64,${btoa(binary)}`
}

export async function readGifAsset(file: File): Promise<GifAsset> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  return { src: bytesToDataUrl(bytes), meta: readGifMeta(bytes) }
}
