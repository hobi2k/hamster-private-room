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
    if (mode === "single") {
      for (const [index, page] of pages.entries()) {
        download(await capture(page), `${safeTitle}-page-${index}.png`)
        await new Promise((resolve) => window.setTimeout(resolve, 180))
      }
      return
    }
    for (const [spreadIndex, pair] of planSpreadExport(pages.length).entries()) {
      const left = await capture(pages[pair.left])
      if (pair.right === null) {
        const pageNumber = pages[pair.left].dataset.pageIndex ?? pair.left
        download(left, `${safeTitle}-page-${pageNumber}.png`)
        await new Promise((resolve) => window.setTimeout(resolve, 180))
        continue
      }
      const right = await capture(pages[pair.right])
      const spread = document.createElement("canvas")
      spread.width = left.width + right.width
      spread.height = Math.max(left.height, right.height)
      const context = spread.getContext("2d")
      if (!context) continue
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, spread.width, spread.height)
      context.drawImage(left, 0, 0)
      context.drawImage(right, left.width, 0)
      download(spread, `${safeTitle}-spread-${spreadIndex + 1}.png`)
      await new Promise((resolve) => window.setTimeout(resolve, 180))
    }
  } finally {
    document.body.classList.remove("is-exporting")
  }
}
