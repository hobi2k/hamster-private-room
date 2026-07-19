const PAGE_RATIO = 1.414

export function fitImageToPage(aspectRatio: number) {
  const safeAspectRatio = Math.max(0.1, aspectRatio || 1)
  const width = Math.min(500, Math.max(100, safeAspectRatio * PAGE_RATIO * 100))
  const height = width / (safeAspectRatio * PAGE_RATIO)
  return {
    width: Math.round(width * 10) / 10,
    x: Math.round(((100 - width) / 2) * 10) / 10,
    y: Math.round(((100 - height) / 2) * 10) / 10,
    rotation: 0,
  }
}
