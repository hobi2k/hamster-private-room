import { describe, expect, it } from "vitest"
import { frameIndexAt, gifTimeline, normalizeDelays } from "./animatedGif"

const totalDelay = (steps: { delay: number }[]) => steps.reduce((sum, step) => sum + step.delay, 0)

describe("animated GIF timeline", () => {
  it("selects a source frame by cumulative delay and loops", () => {
    expect(frameIndexAt(0, [100, 200, 100])).toBe(0)
    expect(frameIndexAt(150, [100, 200, 100])).toBe(1)
    expect(frameIndexAt(350, [100, 200, 100])).toBe(2)
    expect(frameIndexAt(450, [100, 200, 100])).toBe(0)
  })

  it("reproduces a single clip frame for frame at its own delays", () => {
    const source = [100, 100, 100, 100]
    const timeline = gifTimeline([source])
    expect(timeline).toHaveLength(source.length)
    expect(timeline.map((step) => step.delay)).toEqual(source)
    expect(totalDelay(timeline)).toBe(400)
    // Every timeline step must land on its own source frame, in order.
    expect(timeline.map((step) => frameIndexAt(step.time, source))).toEqual([0, 1, 2, 3])
  })

  it("keeps uneven per-frame delays instead of averaging them onto a grid", () => {
    const source = [40, 200, 90, 500]
    const timeline = gifTimeline([source])
    expect(timeline.map((step) => step.delay)).toEqual(source)
    expect(totalDelay(timeline)).toBe(830)
  })

  it("interleaves two clips on the union of their frame boundaries", () => {
    // 200ms period and 300ms period share an exact 600ms span.
    const timeline = gifTimeline([[100, 100], [150, 150]])
    expect(timeline.map((step) => step.time)).toEqual([0, 100, 150, 200, 300, 400, 450, 500])
    expect(totalDelay(timeline)).toBe(600)
    // Neither clip is resampled: each still hits every one of its own frames.
    expect(timeline.map((step) => frameIndexAt(step.time, [100, 100]))).toEqual([0, 1, 1, 0, 1, 0, 0, 1])
  })

  it("stretches to the shared period only when realignment is cheap", () => {
    // 200ms and 300ms realign at 600ms, within 2x the longest clip.
    expect(totalDelay(gifTimeline([[100, 100], [150, 150]]))).toBe(600)
  })

  it("falls back to the longest clip when realignment would cost minutes", () => {
    // 1020ms and 1200ms only realign after 20.4s, which is ~150 page captures.
    expect(totalDelay(gifTimeline([[1020], [1200]]))).toBe(1200)
    // 1000ms and 1010ms would need 101s.
    expect(totalDelay(gifTimeline([[1000], [1010]]))).toBe(1010)
  })

  it("keeps each clip at its own delays even when the span is truncated", () => {
    const timeline = gifTimeline([[1020], [1200]])
    // The 1200ms clip still owns the span; the 1020ms clip loops inside it.
    expect(timeline.map((step) => step.time)).toEqual([0, 1020])
    expect(totalDelay(timeline)).toBe(1200)
  })

  it("caps the frame count so a long clip cannot stall the export", () => {
    const source = new Array(400).fill(50)
    const timeline = gifTimeline([source], 150)
    expect(timeline).toHaveLength(150)
    // Kept frames keep their exact delays; only the tail is dropped.
    expect(timeline.every((step) => step.delay === 50)).toBe(true)
  })

  it("treats a zero delay the way browsers play it", () => {
    expect(normalizeDelays([0, 100, -5, Number.NaN])).toEqual([100, 100, 100, 100])
    expect(normalizeDelays([20, 90])).toEqual([20, 90])
  })

  it("survives a clip with no delays at all", () => {
    expect(gifTimeline([[]])).toEqual([{ time: 0, delay: 100 }])
  })
})
