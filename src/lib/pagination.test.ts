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

  it("applies a per-range font mark to only its range", () => {
    const body = "가나다라마바사"
    const marks: TextMark[] = [{ id: "f", start: 2, end: 5, kind: "font", value: "Pretendard" }]
    const slices = decoratePage(body, page(body), marks, DEFAULT_OPTIONS)
    const styled = slices.find((slice) => slice.text === "다라마")
    const plain = slices.find((slice) => slice.text.startsWith("가나"))
    expect(styled?.style.fontFamily).toBe("Pretendard")
    expect(plain?.style.fontFamily).toBeUndefined()
  })

  it("does not extend highlight or color into the sentence before the selected range", () => {
    const body = "흐트러지지 않았다. 삼백 년이 넘는 세월이 빚어낸 표정의 완성도. 어떤\n거절에도 무너지지 않는 것."
    const start = body.indexOf("삼백")
    const marks: TextMark[] = [
      { id: "highlight", start, end: body.length, kind: "highlight", value: "#f4ce5a66" },
      { id: "color", start, end: body.length, kind: "color", value: "#b94f3c" },
    ]
    const slices = decoratePage(body, page(body), marks, DEFAULT_OPTIONS)

    expect(slices[0]).toEqual({ text: "흐트러지지 않았다. ", style: {} })
    expect(slices.slice(1).map((slice) => slice.text).join("")).toBe(body.slice(start))
    expect(slices.slice(1).every((slice) => (
      slice.style.backgroundColor === "#f4ce5a66" && slice.style.color === "#b94f3c"
    ))).toBe(true)
  })

  it("does not emit any inline style for an align mark (alignment is block-level)", () => {
    const body = "정렬 대상 문단"
    const marks: TextMark[] = [{ id: "al", start: 0, end: body.length, kind: "align", value: "center" }]
    const slices = decoratePage(body, page(body), marks, DEFAULT_OPTIONS)
    slices.forEach((slice) => {
      expect(slice.style.fontWeight).toBeUndefined() // must not fall through to the bold default
      expect(slice.style.color).toBeUndefined()
    })
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
