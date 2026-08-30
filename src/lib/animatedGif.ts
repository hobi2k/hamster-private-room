import html2canvas from "html2canvas"
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js"
import { downloadExportFile, type ExportFile } from "./export"

export type AnimatedGifProgress = {
  frame: number
  total: number
}

type DecodedAnimation = {
  frameUrls: string[]
  delays: number[]
  duration: number
}

const FRAME_DELAY = 125
const MAX_DURATION = 5000

export function frameIndexAt(time: number, delays: number[]) {
  if (!delays.length) return 0
  const normalized = delays.map((delay) => Math.max(20, delay || 100))
  const duration = normalized.reduce((sum, delay) => sum + delay, 0)
  let cursor = ((time % duration) + duration) % duration
  for (const [index, delay] of normalized.entries()) {
    if (cursor < delay) return index
    cursor -= delay
  }
  return normalized.length - 1
}

export function gifTimeline(durations: number[], maxDuration = MAX_DURATION) {
  const duration = Math.max(FRAME_DELAY, Math.min(maxDuration, Math.max(0, ...durations)))
  return Array.from({ length: Math.max(1, Math.ceil(duration / FRAME_DELAY)) }, (_, index) => index * FRAME_DELAY)
}

function safeTitle(title: string) {
  return title.trim().replace(/[\\/:*?"<>|]/g, "-") || "hamster-book"
}

function isGifSource(value: string) {
  return /^data:image\/gif(?:;|,)/i.test(value) || /\.gif(?:$|[?#])/i.test(value)
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

export async function renderSelectedPageGif(
  selectedPage: number,
  title: string,
  onProgress?: (progress: AnimatedGifProgress) => void,
): Promise<ExportFile> {
  const sourcePage = findPage(selectedPage)
  if (!sourcePage) throw new Error("NO_PAGE")
  const sourceImages = Array.from(sourcePage.querySelectorAll<HTMLImageElement>("img"))
  const gifIndexes = sourceImages
    .map((image, index) => ({ index, src: image.getAttribute("src") ?? image.src }))
    .filter((item) => isGifSource(item.src))
  if (!gifIndexes.length) throw new Error("NO_ANIMATED_GIF")

  const animations = await Promise.all(gifIndexes.map((item) => decodeAnimation(item.src)))
  const timeline = gifTimeline(animations.map((animation) => animation.duration))
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
    for (const [timelineIndex, time] of timeline.entries()) {
      for (const [animationIndex, item] of gifIndexes.entries()) {
        const animation = animations[animationIndex]
        cloneImages[item.index].src = animation.frameUrls[frameIndexAt(time, animation.delays)]
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
        delay: FRAME_DELAY,
        repeat: 0,
      })
      onProgress?.({ frame: timelineIndex + 1, total: timeline.length })
    }
    encoder.finish()
    return {
      filename: `${safeTitle(title)}-page-${selectedPage}-animated.gif`,
      blob: new Blob([encoder.bytes()], { type: "image/gif" }),
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
