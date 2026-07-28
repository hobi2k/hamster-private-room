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

export type ExportFile = {
  filename: string
  blob: Blob
}

export function downloadExportFile(file: ExportFile) {
  const link = document.createElement("a")
  const url = URL.createObjectURL(file.blob)
  link.download = file.filename
  link.href = url
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadExportFiles(files: ExportFile[]) {
  for (const [index, file] of files.entries()) {
    downloadExportFile(file)
    if (index < files.length - 1) await new Promise((resolve) => window.setTimeout(resolve, 180))
  }
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

async function exportCanvas(canvas: HTMLCanvasElement, filename: string): Promise<ExportFile> {
  return { filename, blob: await canvasToBlob(canvas) }
}

export function supportsDirectoryExport() {
  return typeof (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker === "function"
}

export async function saveExportFilesToDirectory(files: ExportFile[]) {
  const picker = (window as Window & {
    showDirectoryPicker?: (options: { id: string; mode: "readwrite" }) => Promise<ExportDirectory>
  }).showDirectoryPicker
  if (!picker) return false
  try {
    const directory = await picker.call(window, { id: "hamster-book-export", mode: "readwrite" })
    for (const file of files) await writeExportFile(directory, file.blob, file.filename)
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return false
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
  if (!pages.length) return []
  document.body.classList.add("is-exporting")
  const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, "-") || "hamster-book"
  try {
    if (mode === "selected") {
      const selected = findPage(selectedPage)
      if (!selected) return []
      return [await exportCanvas(await capture(selected), `${safeTitle}-page-${selectedPage}.png`)]
    }
    const pageLabel = (page: HTMLElement, fallback: number) => page.dataset.pageIndex ?? String(fallback)
    if (mode === "single") {
      const files: ExportFile[] = []
      for (const [index, page] of pages.entries()) {
        files.push(await exportCanvas(await capture(page), `${safeTitle}-page-${pageLabel(page, index)}.png`))
      }
      return files
    }
    // Pair the rendered order directly: with a cover this yields (cover, 1),
    // then (2, 3), while a final unpaired page remains a single PNG.
    const files: ExportFile[] = []
    for (const pair of planSpreadExport(pages.length)) {
      const leftEl = pages[pair.left]
      const rightEl = pair.right === null ? null : pages[pair.right]
      const left = await capture(leftEl)
      if (!rightEl) {
        files.push(await exportCanvas(left, `${safeTitle}-page-${pageLabel(leftEl, pair.left)}.png`))
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
      files.push(await exportCanvas(
        spread,
        `${safeTitle}-spread-${pageLabel(leftEl, pair.left)}-${pageLabel(rightEl, pair.right ?? pair.left + 1)}.png`,
      ))
    }
    return files
  } finally {
    document.body.classList.remove("is-exporting")
  }
}
