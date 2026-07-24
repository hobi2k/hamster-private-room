import html2canvas from "html2canvas"
import type { ExportMode } from "../types"

function download(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a")
  link.download = filename
  link.href = canvas.toDataURL("image/png")
  link.click()
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
  if (!pages.length) return
  document.body.classList.add("is-exporting")
  const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, "-") || "hamster-book"
  try {
    if (mode === "selected") {
      const selected = findPage(selectedPage)
      if (!selected) return
      download(await capture(selected), `${safeTitle}-page-${selectedPage}.png`)
      return
    }
    const pageLabel = (page: HTMLElement, fallback: number) => page.dataset.pageIndex ?? String(fallback)
    if (mode === "single") {
      for (const [index, page] of pages.entries()) {
        // Use the logical page number, not the raw array index (which is
        // off-by-one for coverless books).
        download(await capture(page), `${safeTitle}-page-${pageLabel(page, index)}.png`)
        await new Promise((resolve) => window.setTimeout(resolve, 180))
      }
      return
    }
    // Spread mode: the cover (page 0) stands alone; content pages face each other
    // as (1,2),(3,4),... Pairing by raw array index would glue the cover to
    // page 1 and shift every subsequent facing pair.
    const cover = pages[0]?.dataset.pageIndex === "0" ? pages[0] : null
    const content = cover ? pages.slice(1) : pages
    if (cover) {
      download(await capture(cover), `${safeTitle}-page-0.png`)
      await new Promise((resolve) => window.setTimeout(resolve, 180))
    }
    for (let index = 0; index < content.length; index += 2) {
      const leftEl = content[index]
      const rightEl = content[index + 1] ?? null
      const left = await capture(leftEl)
      if (!rightEl) {
        download(left, `${safeTitle}-page-${pageLabel(leftEl, index + (cover ? 1 : 0))}.png`)
        await new Promise((resolve) => window.setTimeout(resolve, 180))
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
      download(spread, `${safeTitle}-spread-${index / 2 + 1}.png`)
      await new Promise((resolve) => window.setTimeout(resolve, 180))
    }
  } finally {
    document.body.classList.remove("is-exporting")
  }
}
