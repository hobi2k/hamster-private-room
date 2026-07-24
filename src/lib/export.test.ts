import { describe, expect, it } from "vitest"
import { createStoreZip } from "./export"

describe("createStoreZip", () => {
  it("writes multiple UTF-8 files into one store-only ZIP", () => {
    const encoder = new TextEncoder()
    const archive = createStoreZip([
      { name: "book-page-0.png", data: new Uint8Array([1, 2, 3]) },
      { name: "책-page-1.png", data: new Uint8Array([4, 5]) },
    ])
    const view = new DataView(archive.buffer)
    const text = new TextDecoder().decode(archive)

    expect(view.getUint32(0, true)).toBe(0x04034b50)
    expect(view.getUint32(archive.length - 22, true)).toBe(0x06054b50)
    expect(view.getUint16(archive.length - 14, true)).toBe(2)
    expect(text).toContain("book-page-0.png")
    expect(text).toContain(new TextDecoder().decode(encoder.encode("책-page-1.png")))
  })
})
