import html2canvas from "html2canvas"
import type { ExportMode } from "../types"

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a")
  link.download = filename
  link.href = canvas.toDataURL("image/png")
  link.click()
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.download = filename
  link.href = url
  link.click()
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

function findPage(selectedPage: number) {
  const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-book-page]"))
  return pages.find((page) => Number(page.dataset.pageIndex) === selectedPage) ?? pages[0]
}

const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  return crc >>> 0
})

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (const value of data) crc = CRC_TABLE[(crc ^ value) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function zipHeader(size: number) {
  const bytes = new Uint8Array(size)
  return { bytes, view: new DataView(bytes.buffer) }
}

function joinBytes(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0))
  let offset = 0
  parts.forEach((part) => {
    result.set(part, offset)
    offset += part.length
  })
  return result
}

export function createStoreZip(files: Array<{ name: string; data: Uint8Array }>) {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let localOffset = 0

  files.forEach((file) => {
    const name = encoder.encode(file.name)
    const crc = crc32(file.data)
    const local = zipHeader(30)
    local.view.setUint32(0, 0x04034b50, true)
    local.view.setUint16(4, 20, true)
    local.view.setUint16(6, 0x0800, true)
    local.view.setUint16(8, 0, true)
    local.view.setUint16(10, 0, true)
    local.view.setUint16(12, 33, true)
    local.view.setUint32(14, crc, true)
    local.view.setUint32(18, file.data.length, true)
    local.view.setUint32(22, file.data.length, true)
    local.view.setUint16(26, name.length, true)
    local.view.setUint16(28, 0, true)
    localParts.push(local.bytes, name, file.data)

    const central = zipHeader(46)
    central.view.setUint32(0, 0x02014b50, true)
    central.view.setUint16(4, 20, true)
    central.view.setUint16(6, 20, true)
    central.view.setUint16(8, 0x0800, true)
    central.view.setUint16(10, 0, true)
    central.view.setUint16(12, 0, true)
    central.view.setUint16(14, 33, true)
    central.view.setUint32(16, crc, true)
    central.view.setUint32(20, file.data.length, true)
    central.view.setUint32(24, file.data.length, true)
    central.view.setUint16(28, name.length, true)
    central.view.setUint32(42, localOffset, true)
    centralParts.push(central.bytes, name)
    localOffset += local.bytes.length + name.length + file.data.length
  })

  const centralDirectory = joinBytes(centralParts)
  const end = zipHeader(22)
  end.view.setUint32(0, 0x06054b50, true)
  end.view.setUint16(8, files.length, true)
  end.view.setUint16(10, files.length, true)
  end.view.setUint32(12, centralDirectory.length, true)
  end.view.setUint32(16, localOffset, true)
  return joinBytes([...localParts, centralDirectory, end.bytes])
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
      downloadCanvas(await capture(selected), `${safeTitle}-page-${selectedPage}.png`)
      return
    }
    const pageLabel = (page: HTMLElement, fallback: number) => page.dataset.pageIndex ?? String(fallback)
    const files: Array<{ name: string; data: Uint8Array }> = []
    const addCanvas = async (canvas: HTMLCanvasElement, filename: string) => {
      const blob = await canvasToBlob(canvas)
      files.push({ name: filename, data: new Uint8Array(await blob.arrayBuffer()) })
    }
    if (mode === "single") {
      for (const [index, page] of pages.entries()) {
        // Use the logical page number, not the raw array index (which is
        // off-by-one for coverless books).
        await addCanvas(await capture(page), `${safeTitle}-page-${pageLabel(page, index)}.png`)
      }
      downloadBlob(new Blob([createStoreZip(files)], { type: "application/zip" }), `${safeTitle}-pages.zip`)
      return
    }
    // Spread mode: the cover (page 0) stands alone; content pages face each other
    // as (1,2),(3,4),... Pairing by raw array index would glue the cover to
    // page 1 and shift every subsequent facing pair.
    const cover = pages[0]?.dataset.pageIndex === "0" ? pages[0] : null
    const content = cover ? pages.slice(1) : pages
    if (cover) {
      await addCanvas(await capture(cover), `${safeTitle}-page-0.png`)
    }
    for (let index = 0; index < content.length; index += 2) {
      const leftEl = content[index]
      const rightEl = content[index + 1] ?? null
      const left = await capture(leftEl)
      if (!rightEl) {
        await addCanvas(left, `${safeTitle}-page-${pageLabel(leftEl, index + (cover ? 1 : 0))}.png`)
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
      await addCanvas(spread, `${safeTitle}-spread-${index / 2 + 1}.png`)
    }
    downloadBlob(new Blob([createStoreZip(files)], { type: "application/zip" }), `${safeTitle}-spreads.zip`)
  } finally {
    document.body.classList.remove("is-exporting")
  }
}
