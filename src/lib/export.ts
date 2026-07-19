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

export async function exportBook(mode: ExportMode, selectedPage: number, title: string) {
  const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-book-page]"))
  if (!pages.length) return
  document.body.classList.add("is-exporting")
  const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, "-") || "hamster-book"
  try {
    if (mode === "selected") {
      const selected = pages.find((page) => Number(page.dataset.pageIndex) === selectedPage) ?? pages[0]
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
    for (let index = 0; index < pages.length; index += 2) {
      const left = await capture(pages[index])
      const right = pages[index + 1] ? await capture(pages[index + 1]) : null
      const spread = document.createElement("canvas")
      spread.width = left.width + (right?.width ?? left.width)
      spread.height = Math.max(left.height, right?.height ?? 0)
      const context = spread.getContext("2d")
      if (!context) continue
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, spread.width, spread.height)
      context.drawImage(left, 0, 0)
      if (right) context.drawImage(right, left.width, 0)
      download(spread, `${safeTitle}-spread-${Math.floor(index / 2) + 1}.png`)
      await new Promise((resolve) => window.setTimeout(resolve, 180))
    }
  } finally {
    document.body.classList.remove("is-exporting")
  }
}
