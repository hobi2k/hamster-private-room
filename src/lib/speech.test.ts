import { describe, expect, it } from "vitest"
import { DEFAULT_OPTIONS } from "../data/themes"
import type { DividerBlock, PageSlice, SpeechBubble } from "../types"
import { estimateSpeechBubbleHeight, moveSpeechBubble, pageForAnchor, speechBubbleWidth } from "./speech"

function bubble(patch: Partial<SpeechBubble> = {}): SpeechBubble {
  return {
    id: "b",
    page: 1,
    anchor: 0,
    profileId: "",
    speakerName: "세븐",
    text: "안녕하세요",
    secondaryText: "",
    x: 10,
    y: 18,
    width: 52,
    autoWidth: true,
    textScale: 100,
    secondaryTextScale: 100,
    showName: true,
    side: "left",
    bubbleColor: "#e6e6e6",
    textColor: "#222",
    zIndex: 1,
    ...patch,
  }
}

function divider(patch: Partial<DividerBlock> = {}): DividerBlock {
  return {
    id: "d",
    anchor: 0,
    style: "solid",
    color: "#222",
    order: 1,
    ...patch,
  }
}

describe("speechBubbleWidth", () => {
  it("stays within the 24–88 percent bounds", () => {
    const narrow = speechBubbleWidth(bubble({ text: "ㅇ" }), "세븐", false)
    const wide = speechBubbleWidth(bubble({ text: "아주 긴 문장을 넣어서 최대 너비를 넘겨 봅니다 정말로 길게 이어집니다 계속" }), "세븐", true)
    expect(narrow).toBeGreaterThanOrEqual(24)
    expect(wide).toBeLessThanOrEqual(88)
  })
})

describe("estimateSpeechBubbleHeight", () => {
  it("honours a manual width — a wider card wraps to fewer lines and is shorter", () => {
    const text = "이 문장은 여러 줄로 감기기에 충분히 길어야 하므로 계속해서 이어 붙여 봅니다 정말로 길게"
    const narrow = estimateSpeechBubbleHeight(bubble({ text, autoWidth: false, width: 24 }), undefined, DEFAULT_OPTIONS)
    const wideCard = estimateSpeechBubbleHeight(bubble({ text, autoWidth: false, width: 88 }), undefined, DEFAULT_OPTIONS)
    expect(wideCard).toBeLessThan(narrow)
  })

  it("returns a positive height", () => {
    expect(estimateSpeechBubbleHeight(bubble(), undefined, DEFAULT_OPTIONS)).toBeGreaterThan(0)
  })
})

describe("pageForAnchor", () => {
  const pages: PageSlice[] = [
    { text: "a", start: 0, end: 10 },
    { text: "b", start: 10, end: 20 },
    { text: "c", start: 20, end: 30 },
  ]

  it("maps an anchor to its 1-based page", () => {
    expect(pageForAnchor(5, pages)).toBe(1)
    expect(pageForAnchor(15, pages)).toBe(2)
    expect(pageForAnchor(25, pages)).toBe(3)
  })

  it("clamps an anchor past the end onto the last page", () => {
    expect(pageForAnchor(999, pages)).toBe(3)
  })
})

describe("moveSpeechBubble", () => {
  it("swaps z-order for two bubbles sharing an anchor", () => {
    const bubbles = [bubble({ id: "a", anchor: 5, zIndex: 1 }), bubble({ id: "b", anchor: 5, zIndex: 2 })]
    const moved = moveSpeechBubble(bubbles, [], "a", 1)
    const a = moved.find((item) => item.id === "a")!
    const b = moved.find((item) => item.id === "b")!
    expect(a.zIndex).toBe(2)
    expect(b.zIndex).toBe(1)
  })

  it("is a no-op moving the last bubble further down", () => {
    const bubbles = [bubble({ id: "a", anchor: 5, zIndex: 1 }), bubble({ id: "b", anchor: 5, zIndex: 2 })]
    expect(moveSpeechBubble(bubbles, [], "b", 1)).toBe(bubbles)
  })

  it("moves past the adjacent divider instead of skipping to the next bubble", () => {
    const bubbles = [
      bubble({ id: "a", anchor: 5, zIndex: 1 }),
      bubble({ id: "b", anchor: 30, zIndex: 2 }),
    ]
    const moved = moveSpeechBubble(bubbles, [divider({ anchor: 12 })], "a", 1)
    expect(moved.find((item) => item.id === "a")).toMatchObject({ anchor: 12, flowRank: 1 })
    expect(moved.find((item) => item.id === "b")?.anchor).toBe(30)
  })

  it("places a bubble immediately before the adjacent divider when moving up", () => {
    const bubbles = [bubble({ id: "a", anchor: 20, zIndex: 2 })]
    const moved = moveSpeechBubble(bubbles, [divider({ anchor: 12 })], "a", -1)
    expect(moved[0].anchor).toBe(12)
  })

  it("moves to the adjacent bubble without swapping their distant anchors", () => {
    const bubbles = [
      bubble({ id: "a", anchor: 5, zIndex: 1 }),
      bubble({ id: "b", anchor: 20, zIndex: 2 }),
      bubble({ id: "c", anchor: 35, zIndex: 3 }),
    ]
    const moved = moveSpeechBubble(bubbles, [], "a", 1)
    expect(moved.find((item) => item.id === "a")?.anchor).toBe(20)
    expect(moved.find((item) => item.id === "b")?.anchor).toBe(20)
    expect(moved.find((item) => item.id === "c")?.anchor).toBe(35)
  })

  it("crosses exactly one of multiple dividers sharing an anchor", () => {
    const bubbles = [bubble({ id: "a", anchor: 12, zIndex: 1 })]
    const dividers = [
      divider({ id: "d1", anchor: 12, order: 10 }),
      divider({ id: "d2", anchor: 12, order: 20 }),
    ]
    const moved = moveSpeechBubble(bubbles, dividers, "a", 1)
    expect(moved[0]).toMatchObject({ anchor: 12, flowRank: 1, zIndex: 15 })
  })
})
