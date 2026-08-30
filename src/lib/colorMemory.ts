export const COLOR_MEMORY_KEY = "hamster-color-memory-v1"
export const COLOR_MEMORY_EVENT = "hamster-color-memory-change"

export const RECOMMENDED_COLORS = [
  "#6fbfa8",
  "#d9f2ea",
  "#ef94b8",
  "#ffe1ec",
  "#ab8fe0",
  "#e7defb",
  "#4d3a4a",
  "#fff9f0",
]

export type ColorMemory = {
  recent: string[]
  pinned: string[]
}

export const EMPTY_COLOR_MEMORY: ColorMemory = { recent: [], pinned: [] }

export function normalizeHexColor(value: string) {
  const normalized = value.trim().toLowerCase()
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : ""
}

function uniqueColors(colors: string[], limit: number) {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const color of colors) {
    const next = normalizeHexColor(color)
    if (!next || seen.has(next)) continue
    seen.add(next)
    normalized.push(next)
    if (normalized.length >= limit) break
  }
  return normalized
}

export function normalizeColorMemory(value: Partial<ColorMemory> | null | undefined): ColorMemory {
  return {
    recent: uniqueColors(Array.isArray(value?.recent) ? value.recent : [], 8),
    pinned: uniqueColors(Array.isArray(value?.pinned) ? value.pinned : [], 10),
  }
}

export function rememberColor(memory: ColorMemory, color: string): ColorMemory {
  const normalized = normalizeHexColor(color)
  if (!normalized) return normalizeColorMemory(memory)
  return normalizeColorMemory({
    ...memory,
    recent: [normalized, ...memory.recent.filter((item) => normalizeHexColor(item) !== normalized)],
  })
}

export function togglePinnedColor(memory: ColorMemory, color: string): ColorMemory {
  const normalized = normalizeHexColor(color)
  if (!normalized) return normalizeColorMemory(memory)
  const pinned = memory.pinned.some((item) => normalizeHexColor(item) === normalized)
    ? memory.pinned.filter((item) => normalizeHexColor(item) !== normalized)
    : [normalized, ...memory.pinned]
  return normalizeColorMemory({ ...memory, pinned })
}

export function readColorMemory(storage: Pick<Storage, "getItem"> = window.localStorage): ColorMemory {
  try {
    const raw = storage.getItem(COLOR_MEMORY_KEY)
    return normalizeColorMemory(raw ? JSON.parse(raw) as Partial<ColorMemory> : null)
  } catch {
    return EMPTY_COLOR_MEMORY
  }
}

export function writeColorMemory(memory: ColorMemory, storage: Pick<Storage, "setItem"> = window.localStorage) {
  const normalized = normalizeColorMemory(memory)
  try {
    storage.setItem(COLOR_MEMORY_KEY, JSON.stringify(normalized))
  } catch {
    // Color history is an enhancement; editing must keep working if storage is full.
  }
  return normalized
}
