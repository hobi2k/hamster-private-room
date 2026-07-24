import { describe, expect, it } from "vitest"
import { DEFAULT_OPTIONS } from "../data/themes"
import type { TextMark } from "../types"
import { decoratePage, PAGE_BREAK, paginateText } from "./pagination"

describe("paginateText", () => {
  it("keeps short text on a single page", () => {
    const pages = paginateText("짧은 글", DEFAULT_OPTIONS)
    expect(pages).toHaveLength(1)
    expect(pages[0].start).toBe(0)
    expect(pages[0].end).toBe("짧은 글".length)
  })

  it("splits on an explicit page break", () => {
    const body = `앞 페이지${PAGE_BREAK}뒤 페이지`
    const pages = paginateText(body, DEFAULT_OPTIONS)
    expect(pages).toHaveLength(2)
    expect(pages[0].text).toBe("앞 페이지")
    expect(pages[1].text).toBe("뒤 페이지")
  })

  it("covers the whole body contiguously across pages", () => {
    const body = Array.from({ length: 60 }, (_, index) => `${index}번째 문장을 길게 이어서 적어 봅니다.`).join("\n")
    const pages = paginateText(body, DEFAULT_OPTIONS)
    expect(pages.length).toBeGreaterThan(1)
    const joined = pages.map((page) => body.slice(page.start, page.end)).join("")
    expect(joined).toBe(body)
  })
})

describe("decoratePage mark handling", () => {
  const page = (body: string) => ({ text: body, start: 0, end: body.length })

  it("applies a user highlight mark", () => {
    const body = "hello world"
    const marks: TextMark[] = [{ id: "1", start: 0, end: 5, kind: "highlight", value: "#ffdd55" }]
    const slices = decoratePage(body, page(body), marks, DEFAULT_OPTIONS)
    const highlighted = slices.find((slice) => slice.text.startsWith("hello"))
    expect(highlighted?.style.backgroundColor).toBe("#ffdd55")
  })

  it("lets a user mark win over smart-quote styling without undefined clobbering", () => {
    const body = '"인용"'
    const marks: TextMark[] = [
      { id: "a", start: 0, end: body.length, kind: "color", value: "#123456" },
      { id: "b", start: 0, end: body.length, kind: "italic", value: "" },
    ]
    const slices = decoratePage(body, page(body), marks, { ...DEFAULT_OPTIONS, quoteItalic: false })
    const style = slices[0].style
    expect(style.color).toBe("#123456") // user color beats smart quoteColor
    expect(style.fontStyle).toBe("italic") // smart's undefined fontStyle does not erase the user italic
  })
})
