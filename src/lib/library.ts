import type { BookDocument, BookSlot } from "../types"

export const LEGACY_DOCUMENT_KEY = "hamster-private-room/document/v1"
export const BOOK_INDEX_KEY = "hamster-private-room/books/v1"
export const ACTIVE_BOOK_KEY = "hamster-private-room/active-book/v1"
export const LEGACY_BOOK_ID = "legacy"
const BOOK_KEY_PREFIX = "hamster-private-room/book/v1/"

export function bookStorageKey(id: string) {
  return id === LEGACY_BOOK_ID ? LEGACY_DOCUMENT_KEY : `${BOOK_KEY_PREFIX}${id}`
}

export function createBookSlot(id: string, documentState: BookDocument, createdAt = documentState.updatedAt): BookSlot {
  return {
    id,
    title: documentState.title.trim() || "제목 없는 책",
    createdAt,
    updatedAt: documentState.updatedAt,
    bodyLength: documentState.body.length,
    backgroundColor: documentState.options.backgroundColor,
    accentColor: documentState.options.quoteColor,
  }
}

export function upsertBookSlot(slots: BookSlot[], id: string, documentState: BookDocument) {
  const previous = slots.find((slot) => slot.id === id)
  return [
    createBookSlot(id, documentState, previous?.createdAt),
    ...slots.filter((slot) => slot.id !== id),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function loadBookSlots(storage: Storage) {
  const saved = storage.getItem(BOOK_INDEX_KEY)
  if (!saved) return []
  try {
    const parsed = JSON.parse(saved) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isBookSlot).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  } catch {
    return []
  }
}

export function saveBookSlots(storage: Storage, slots: BookSlot[]) {
  storage.setItem(BOOK_INDEX_KEY, JSON.stringify(slots))
}

function isBookSlot(value: unknown): value is BookSlot {
  if (!value || typeof value !== "object") return false
  const slot = value as Partial<BookSlot>
  return typeof slot.id === "string"
    && typeof slot.title === "string"
    && typeof slot.createdAt === "string"
    && typeof slot.updatedAt === "string"
    && typeof slot.bodyLength === "number"
    && typeof slot.backgroundColor === "string"
    && typeof slot.accentColor === "string"
}
