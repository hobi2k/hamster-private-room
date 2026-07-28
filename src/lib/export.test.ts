import { describe, expect, it, vi } from "vitest"
import { clearExportSelection, planSpreadExport, writeExportFile } from "./export"
import type { ExportDirectory } from "./export"

describe("planSpreadExport", () => {
  it("pairs the cover with page 1 and then pages 2 and 3", () => {
    expect(planSpreadExport(4)).toEqual([
      { left: 0, right: 1 },
      { left: 2, right: 3 },
    ])
  })

  it("leaves only the final odd page unpaired", () => {
    expect(planSpreadExport(5)).toEqual([
      { left: 0, right: 1 },
      { left: 2, right: 3 },
      { left: 4, right: null },
    ])
  })
})

describe("writeExportFile", () => {
  it("writes a PNG blob directly into the selected directory", async () => {
    const writes: Blob[] = []
    const names: string[] = []
    let closed = false
    const directory = {
      async getFileHandle(name: string) {
        names.push(name)
        return {
          async createWritable() {
            return {
              async write(value: Blob) {
                writes.push(value)
              },
              async close() {
                closed = true
              },
            }
          },
        }
      },
    } satisfies ExportDirectory
    const png = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" })

    await writeExportFile(directory, png, "book-spread-0-1.png")

    expect(names).toEqual(["book-spread-0-1.png"])
    expect(writes).toEqual([png])
    expect(closed).toBe(true)
  })
})

describe("clearExportSelection", () => {
  it("removes editor focus and the native browser selection before a PNG capture", () => {
    const blur = vi.fn()
    const removeAllRanges = vi.fn()

    clearExportSelection({ blur }, { removeAllRanges })

    expect(blur).toHaveBeenCalledOnce()
    expect(removeAllRanges).toHaveBeenCalledOnce()
  })
})
