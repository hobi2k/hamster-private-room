import html2canvas from "html2canvas"
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js"
import { downloadExportFile, type ExportFile } from "./export"
import { isGifSource } from "./gif"

export type AnimatedGifProgress = {
  frame: number
  total: number
}

type DecodedAnimation = {
  frameUrls: string[]
  delays: number[]
  duration: number
}

// A GIF stores each delay in centiseconds, and gifuct hands them back already
// multiplied by 10 — so every source delay is a multiple of 10ms and survives
// the round trip through the encoder exactly.
const FALLBACK_DELAY = 100
// Each timeline frame costs one full page capture (~1s), so cap the count
// rather than the duration: this is the ceiling on export time, not on
// playback speed.
const MAX_TIMELINE_FRAMES = 80
// Clips with near-coprime periods realign only after a huge span — 1020ms and
// 1200ms need 20.4s, which is minutes of captures. Only stretch past the
// longest clip when realignment is nearly free.
const MAX_SPAN_MULTIPLE = 2

export type TimelineFrame = {
  time: number
  delay: number
}

export function normalizeDelays(delays: number[]) {
  // A 0 delay is legal but every browser renders it as ~100ms, so treating it
  // as 100 keeps the export playing at the speed the original actually plays.
  return delays.map((delay) => Number.isFinite(delay) && delay > 0 ? Math.round(delay) : FALLBACK_DELAY)
}

export function frameIndexAt(time: number, delays: number[]) {
  if (!delays.length) return 0
  const normalized = normalizeDelays(delays)
  const duration = normalized.reduce((sum, delay) => sum + delay, 0)
  let cursor = ((time % duration) + duration) % duration
  for (const [index, delay] of normalized.entries()) {
    if (cursor < delay) return index
    cursor -= delay
  }
  return normalized.length - 1
}

function greatestCommonDivisor(a: number, b: number) {
  let [x, y] = [a, b]
  while (y) [x, y] = [y, x % y]
  return x || 1
}

// Sample on the union of the clips' own frame boundaries instead of a fixed
// grid. With a single GIF that reproduces its frames and delays one for one;
// a fixed grid dropped frames and stretched the total duration.
export function gifTimeline(delayLists: number[][], maxFrames = MAX_TIMELINE_FRAMES): TimelineFrame[] {
  const clips = delayLists.map(normalizeDelays).filter((delays) => delays.length)
  if (!clips.length) return [{ time: 0, delay: FALLBACK_DELAY }]
  const periods = clips.map((delays) => delays.reduce((sum, delay) => sum + delay, 0))
  // A single clip always reproduces itself exactly; extra clips only widen the
  // span when their shared period is cheap, otherwise the longest clip sets it
  // and the others loop within it — still at their own true delays.
  const longest = Math.max(...periods)
  const span = periods.reduce((exact, period) => {
    const combined = (exact / greatestCommonDivisor(exact, period)) * period
    return combined <= longest * MAX_SPAN_MULTIPLE ? combined : Math.max(exact, period)
  }, periods[0])

  const boundaries = new Set<number>()
  for (const delays of clips) {
    let time = 0
    for (let index = 0; time < span; index += 1) {
      boundaries.add(time)
      time += delays[index % delays.length]
    }
  }

  const times = [...boundaries].sort((a, b) => a - b)
  return times
    .map((time, index) => ({ time, delay: (index + 1 < times.length ? times[index + 1] : span) - time }))
    .slice(0, maxFrames)
}

function safeTitle(title: string) {
  return title.trim().replace(/[\\/:*?"<>|]/g, "-") || "hamster-book"
}

function imageData(frame: ParsedFrame) {
  return new ImageData(frame.patch, frame.dims.width, frame.dims.height)
}

async function decodeAnimation(src: string): Promise<DecodedAnimation> {
  const response = await fetch(src)
  if (!response.ok) throw new Error("GIF_FETCH_FAILED")
  const parsed = parseGIF(await response.arrayBuffer())
  const frames = decompressFrames(parsed, true)
  if (!frames.length) throw new Error("GIF_HAS_NO_FRAMES")

  const canvas = document.createElement("canvas")
  canvas.width = parsed.lsd.width
  canvas.height = parsed.lsd.height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("GIF_CANVAS_FAILED")

  let previous: ParsedFrame | null = null
  let restore: ImageData | null = null
  const frameUrls: string[] = []
  const delays: number[] = []
  for (const frame of frames) {
    if (previous?.disposalType === 2) {
      context.clearRect(previous.dims.left, previous.dims.top, previous.dims.width, previous.dims.height)
    } else if (previous?.disposalType === 3 && restore) {
      context.putImageData(restore, 0, 0)
    }
    restore = frame.disposalType === 3 ? context.getImageData(0, 0, canvas.width, canvas.height) : null
    // Draw through a temporary canvas so transparent patch pixels preserve the
    // previous composed frame instead of erasing it (putImageData would replace
    // those pixels with transparent black).
    const patchCanvas = document.createElement("canvas")
    patchCanvas.width = frame.dims.width
    patchCanvas.height = frame.dims.height
    const patchContext = patchCanvas.getContext("2d")
    if (!patchContext) throw new Error("GIF_PATCH_CANVAS_FAILED")
    patchContext.putImageData(imageData(frame), 0, 0)
    context.drawImage(patchCanvas, frame.dims.left, frame.dims.top)
    frameUrls.push(canvas.toDataURL("image/png"))
    delays.push(Math.max(20, frame.delay || 100))
    previous = frame
  }

  return {
    frameUrls,
    delays,
    duration: delays.reduce((sum, delay) => sum + delay, 0),
  }
}

async function settleImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"))
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth) return
    try {
      await image.decode()
    } catch {
      await new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true })
        image.addEventListener("error", () => resolve(), { once: true })
      })
    }
  }))
}

function findPage(selectedPage: number) {
  const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-book-page]"))
  return pages.find((page) => Number(page.dataset.pageIndex) === selectedPage) ?? pages[0]
}

export type AnimatedGifFile = ExportFile & {
  frames: number
  duration: number
  exact: boolean
}

export async function renderSelectedPageGif(
  selectedPage: number,
  title: string,
  onProgress?: (progress: AnimatedGifProgress) => void,
): Promise<AnimatedGifFile> {
  const sourcePage = findPage(selectedPage)
  if (!sourcePage) throw new Error("NO_PAGE")
  const sourceImages = Array.from(sourcePage.querySelectorAll<HTMLImageElement>("img"))
  const gifIndexes = sourceImages
    .map((image, index) => ({ index, src: image.getAttribute("src") ?? image.src }))
    .filter((item) => isGifSource(item.src))
  if (!gifIndexes.length) throw new Error("NO_ANIMATED_GIF")

  const animations = await Promise.all(gifIndexes.map((item) => decodeAnimation(item.src)))
  if (!animations.some((animation) => animation.frameUrls.length > 1)) throw new Error("NO_ANIMATED_GIF")
  const timeline = gifTimeline(animations.map((animation) => animation.delays))
  const clone = sourcePage.cloneNode(true) as HTMLElement
  const rect = sourcePage.getBoundingClientRect()
  clone.classList.add("gif-export-stage")
  clone.style.width = `${rect.width}px`
  clone.style.height = `${rect.height}px`
  document.body.append(clone)
  document.body.classList.add("is-exporting")

  try {
    const cloneImages = Array.from(clone.querySelectorAll<HTMLImageElement>("img"))
    const { GIFEncoder, applyPalette, quantize } = await import("gifenc")
    const encoder = GIFEncoder()
    for (const [timelineIndex, step] of timeline.entries()) {
      for (const [animationIndex, item] of gifIndexes.entries()) {
        const animation = animations[animationIndex]
        cloneImages[item.index].src = animation.frameUrls[frameIndexAt(step.time, animation.delays)]
      }
      await settleImages(clone)
      const canvas = await html2canvas(clone, {
        backgroundColor: null,
        scale: 1,
        useCORS: true,
        logging: false,
      })
      const context = canvas.getContext("2d", { willReadFrequently: true })
      if (!context) throw new Error("GIF_CAPTURE_FAILED")
      const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data
      const palette = quantize(rgba, 256, { format: "rgb565" })
      const indexed = applyPalette(rgba, palette, "rgb565")
      encoder.writeFrame(indexed, canvas.width, canvas.height, {
        palette,
        delay: step.delay,
        repeat: 0,
      })
      onProgress?.({ frame: timelineIndex + 1, total: timeline.length })
    }
    encoder.finish()
    const sourceFrames = Math.max(...animations.map((animation) => animation.frameUrls.length))
    return {
      filename: `${safeTitle(title)}-page-${selectedPage}-animated.gif`,
      blob: new Blob([encoder.bytes()], { type: "image/gif" }),
      frames: timeline.length,
      duration: timeline.reduce((sum, step) => sum + step.delay, 0),
      // True when no frame was dropped to the cap, so playback matches the source.
      exact: timeline.length >= sourceFrames,
    }
  } finally {
    clone.remove()
    document.body.classList.remove("is-exporting")
  }
}

export async function exportSelectedPageGif(
  selectedPage: number,
  title: string,
  onProgress?: (progress: AnimatedGifProgress) => void,
) {
  const file = await renderSelectedPageGif(selectedPage, title, onProgress)
  downloadExportFile(file)
  return file
}
