import html2canvas from "html2canvas"
import type { ExportMode } from "../types"

export type ExportDirectory = {
  getFileHandle: (name: string, options: { create: true }) => Promise<{
    createWritable: () => Promise<{
      write: (value: Blob) => Promise<void>
      close: () => Promise<void>
    }>
  }>
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.download = filename
  link.href = url
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function capture(element: HTMLElement) {
  return html2canvas(element, {
    backgroundColor: null,
    scale: Math.max(2, window.devicePixelRatio),
    useCORS: true,
    logging: false,
  })
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG conversion failed")), "image/png")
  })
}

export async function writeExportFile(directory: ExportDirectory, blob: Blob, filename: string) {
  const file = await directory.getFileHandle(filename, { create: true })
  const writable = await file.createWritable()
  await writable.write(blob)
  await writable.close()
}

async function saveCanvas(canvas: HTMLCanvasElement, filename: string, directory?: ExportDirectory) {
  const blob = await canvasToBlob(canvas)
  if (directory) {
    await writeExportFile(directory, blob, filename)
    return
  }
  downloadBlob(blob, filename)
}

async function chooseExportDirectory(mode: ExportMode) {
  if (mode === "selected") return undefined
  const picker = (window as Window & {
    showDirectoryPicker?: (options: { id: string; mode: "readwrite" }) => Promise<ExportDirectory>
  }).showDirectoryPicker
  if (!picker) return undefined
  try {
    return await picker.call(window, { id: "hamster-book-export", mode: "readwrite" })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return null
    throw error
  }
}

function findPage(selectedPage: number) {
  const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-book-page]"))
  return pages.find((page) => Number(page.dataset.pageIndex) === selectedPage) ?? pages[0]
}

export function planSpreadExport(pageCount: number) {
  return Array.from({ length: Math.ceil(pageCount / 2) }, (_, index) => ({
    left: index * 2,
    right: index * 2 + 1 < pageCount ? index * 2 + 1 : null,
  }))
}

export async function copyBookPage(selectedPage: number) {
  const selected = findPage(selectedPage)
  if (!selected || !navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Image clipboard is not supported")
  }
  document.body.classList.add("is-exporting")
  try {
    const blob = capture(selected).then(canvasToBlob)
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
  } finally {
    document.body.classList.remove("is-exporting")
  }
}

export async function exportBook(mode: ExportMode, selectedPage: number, title: string) {
  const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-book-page]"))
  if (!pages.length) return false
  const directory = await chooseExportDirectory(mode)
  if (directory === null) return false
  document.body.classList.add("is-exporting")
  const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, "-") || "hamster-book"
  try {
    if (mode === "selected") {
      const selected = findPage(selectedPage)
      if (!selected) return false
      await saveCanvas(await capture(selected), `${safeTitle}-page-${selectedPage}.png`)
      return true
    }
    const pageLabel = (page: HTMLElement, fallback: number) => page.dataset.pageIndex ?? String(fallback)
    if (mode === "single") {
      for (const [index, page] of pages.entries()) {
        await saveCanvas(await capture(page), `${safeTitle}-page-${pageLabel(page, index)}.png`, directory)
        if (!directory) await new Promise((resolve) => window.setTimeout(resolve, 180))
      }
      return true
    }
    // Pair the rendered order directly: with a cover this yields (cover, 1),
    // then (2, 3), while a final unpaired page remains a single PNG.
    for (const pair of planSpreadExport(pages.length)) {
      const leftEl = pages[pair.left]
      const rightEl = pair.right === null ? null : pages[pair.right]
      const left = await capture(leftEl)
      if (!rightEl) {
        await saveCanvas(left, `${safeTitle}-page-${pageLabel(leftEl, pair.left)}.png`, directory)
        if (!directory) await new Promise((resolve) => window.setTimeout(resolve, 180))
        continue
      }
      const right = await capture(rightEl)
      const spread = document.createElement("canvas")
      spread.width = left.width + right.width
      spread.height = Math.max(left.height, right.height)
      const context = spread.getContext("2d")
      if (!context) continue
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, spread.width, spread.height)
      context.drawImage(left, 0, 0)
      context.drawImage(right, left.width, 0)
      await saveCanvas(
        spread,
        `${safeTitle}-spread-${pageLabel(leftEl, pair.left)}-${pageLabel(rightEl, pair.right ?? pair.left + 1)}.png`,
        directory,
      )
      if (!directory) await new Promise((resolve) => window.setTimeout(resolve, 180))
    }
    return true
  } finally {
    document.body.classList.remove("is-exporting")
  }
}
