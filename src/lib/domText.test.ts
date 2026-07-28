import { describe, expect, it } from "vitest"
import { chooseFlowTextSelection } from "./domText"

const body = "흐트러지지 않았다. 삼백 년이 넘는 세월이 빚어낸 표정의 완성도. 어떤\n거절에도 무너지지 않는 것."

describe("chooseFlowTextSelection", () => {
  it("keeps the stored range when a stale DOM range grows into the previous sentence", () => {
    const stored = { start: body.indexOf("삼백"), end: body.length }
    const stale = { start: 0, end: body.length }

    expect(chooseFlowTextSelection(body, stored, stale, body.slice(stored.start))).toEqual(stored)
  })

  it("accepts a newer live range when its text matches the visible selection", () => {
    const stored = { start: 0, end: body.indexOf("삼백") - 1 }
    const live = { start: body.indexOf("삼백"), end: body.length }

    expect(chooseFlowTextSelection(body, stored, live, body.slice(live.start))).toEqual(live)
  })

  it("falls back to a valid stored range after the browser collapses its selection", () => {
    const stored = { start: body.indexOf("삼백"), end: body.length }

    expect(chooseFlowTextSelection(body, stored, { start: body.length, end: body.length }, "")).toEqual(stored)
  })
})
