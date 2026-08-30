import { describe, expect, it } from "vitest"
import { DEFAULT_OPTIONS } from "../data/themes"
import type { TextMark } from "../types"
import { decoratePage, flowInsertionAnchor, flowInsertionPage, PAGE_BREAK, paginateText } from "./pagination"

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

  it("uses the configured free page height as the pagination boundary", () => {
    const body = "가".repeat(2400)
    const short = paginateText(body, { ...DEFAULT_OPTIONS, pageHeight: 420 })
    const tall = paginateText(body, { ...DEFAULT_OPTIONS, pageHeight: 1200 })
    expect(short.length).toBeGreaterThan(tall.length)
  })

  it("does not let a flow block drift before its selected page", () => {
    const body = "가".repeat(1800)
    const baseline = paginateText(body, DEFAULT_OPTIONS)
    const boundary = baseline[0].end
    const pages = paginateText(body, DEFAULT_OPTIONS, [{ id: "bubble", anchor: boundary, height: 120, minPage: 2 }])
    expect(pages[0].blockIds).not.toContain("bubble")
    expect(pages[1].blockIds).toContain("bubble")
    expect(pages[1].text.length).toBeGreaterThan(0)
  })
})

describe("flowInsertionAnchor", () => {
  const page = { text: "둘째 페이지", start: 100, end: 160 }

  it("uses a caret inside the selected page", () => {
    expect(flowInsertionAnchor(page, { start: 124, end: 124 }, false)).toBe(124)
  })

  it("keeps an end-of-page caret so a flow block can begin the next page", () => {
    expect(flowInsertionAnchor(page, null, false)).toBe(100)
    expect(flowInsertionAnchor(page, { start: 160, end: 160 }, false)).toBe(160)
  })

  it("keeps the document-end caret on the final page", () => {
    expect(flowInsertionAnchor(page, { start: 160, end: 160 }, true)).toBe(160)
  })
})

describe("flowInsertionPage", () => {
  it("places a block after a non-final page when the caret is at its end", () => {
    const page = { text: "첫 페이지", start: 0, end: 100 }
    expect(flowInsertionPage(1, page, 100, 3)).toBe(2)
    expect(flowInsertionPage(1, page, 99, 3)).toBe(1)
    expect(flowInsertionPage(3, { ...page, start: 200, end: 300 }, 300, 3)).toBe(3)
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

  it("renders underline and strike marks as text decoration", () => {
    const body = "밑줄취소"
    const marks: TextMark[] = [
      { id: "u", start: 0, end: 2, kind: "underline", value: "underline" },
      { id: "s", start: 2, end: 4, kind: "strike", value: "line-through" },
    ]
    const slices = decoratePage(body, page(body), marks, DEFAULT_OPTIONS)
    expect(slices[0].style.textDecoration).toBe("underline")
    expect(slices[1].style.textDecoration).toBe("line-through")
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
