import { Check, House, Menu, MousePointer2, Plus, Save, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { BookCanvas } from "./components/BookCanvas"
import { HamsterMascot } from "./components/HamsterMascot"
import { HomeScreen } from "./components/HomeScreen"
import { Inspector } from "./components/Inspector"
import { ToolRail } from "./components/ToolRail"
import { DEFAULT_OPTIONS } from "./data/themes"
import { copyBookPage, exportBook } from "./lib/export"
import { fitImageToPage } from "./lib/image"
import {
  ACTIVE_BOOK_KEY,
  bookStorageKey,
  createBookSlot,
  LEGACY_BOOK_ID,
  LEGACY_DOCUMENT_KEY,
  loadBookSlots,
  saveBookSlots,
  upsertBookSlot,
} from "./lib/library"
import { PAGE_BREAK, paginateText } from "./lib/pagination"
import { estimateSpeechBubbleHeight, moveSpeechBubble, pageForAnchor, pageForBlock } from "./lib/speech"
import type {
  BookDocument,
  BookOptions,
  BookSlot,
  DividerBlock,
  DividerStyle,
  EditorTab,
  ExportMode,
  FooterNote,
  ImageLayer,
  MarkKind,
  MemberProfile,
  SpeechBubble,
  ThemePreset,
  TextSelection,
  ToastState,
} from "./types"

const PRESET_KEY = "hamster-private-room/presets/v1"
const DEFAULT_BODY = `비가 오려는 오후였다. 창문 가장자리에는 아직 이름 없는 빛이 오래 머물렀다.

"조금 늦어도 괜찮아. 오늘의 문장은 오늘 안에만 오면 되니까."

나는 책상 위의 종이를 반듯하게 밀었다. (잊지 말 것: 마음에 드는 문장은 두 번 읽기.) 작은 방 안에서 종이 넘기는 소리가 생각보다 멀리 갔다.

한 페이지를 채우는 일은 하루를 정리하는 일과 닮았다. 꼭 필요한 장면만 남기고, 나머지는 여백에게 맡긴다.`

function createDocument(): BookDocument {
  return {
    version: 1,
    title: "작고 사적인 방",
    body: DEFAULT_BODY,
    options: { ...DEFAULT_OPTIONS },
    images: [],
    members: [],
    speechBubbles: [],
    dividers: [],
    marks: [],
    footers: {},
    updatedAt: new Date().toISOString(),
  }
}

function documentFlowBlocks(
  bubbles: SpeechBubble[],
  dividers: DividerBlock[],
  members: MemberProfile[],
  options: BookOptions,
) {
  const speechBlocks = bubbles
    .filter((bubble) => bubble.page > 0)
    .sort((left, right) => left.anchor - right.anchor || left.zIndex - right.zIndex)
    .map((bubble) => ({
      id: bubble.id,
      anchor: bubble.anchor,
      height: estimateSpeechBubbleHeight(
        bubble,
        members.find((member) => member.id === bubble.profileId),
        options,
      ),
    }))
  const dividerBlocks = dividers.map((divider) => ({
    id: divider.id,
    anchor: divider.anchor,
    height: options.pageWidth * 0.09,
  }))
  return [...speechBlocks, ...dividerBlocks]
}

function normalizeDocument(parsed: Partial<BookDocument>) {
  const options = { ...DEFAULT_OPTIONS, ...parsed.options }
  const members = normalizeMembers(parsed.members)
  let body = typeof parsed.body === "string" ? parsed.body : DEFAULT_BODY
  let marks = Array.isArray(parsed.marks) ? parsed.marks : []
  const basePages = paginateText(body, options)
  let speechBubbles = Array.isArray(parsed.speechBubbles) ? parsed.speechBubbles.map((bubble) => {
    const page = Math.max(0, bubble.page ?? 1)
    const slice = basePages[Math.max(0, page - 1)] ?? basePages.at(-1)
    const legacyAnchor = page === 0 || !slice
      ? 0
      : slice.start + Math.round((slice.end - slice.start) * Math.max(0, Math.min(100, bubble.y ?? 18)) / 100)
    return { ...bubble, page, anchor: Math.max(0, Math.min(body.length, Number.isFinite(bubble.anchor) ? bubble.anchor : legacyAnchor)) }
  }) : []
  const legacyDialogueTexts = (parsed as Partial<BookDocument> & {
    dialogueTexts?: Array<{ afterBubbleId: string; text: string }>
  }).dialogueTexts

  if (Array.isArray(legacyDialogueTexts)) {
    legacyDialogueTexts.forEach((block) => {
      const text = block.text.trim()
      const owner = speechBubbles.find((bubble) => bubble.id === block.afterBubbleId)
      if (!owner || !text) return
      const insertion = `${owner.anchor > 0 && body[owner.anchor - 1] !== "\n" ? "\n" : ""}${text}\n`
      body = `${body.slice(0, owner.anchor)}${insertion}${body.slice(owner.anchor)}`
      marks = marks.map((mark) => mark.start >= owner.anchor
        ? { ...mark, start: mark.start + insertion.length, end: mark.end + insertion.length }
        : mark.end > owner.anchor ? { ...mark, end: mark.end + insertion.length } : mark)
      speechBubbles = speechBubbles.map((bubble) => (
        bubble.id !== owner.id && (bubble.anchor > owner.anchor || (bubble.anchor === owner.anchor && bubble.zIndex > owner.zIndex))
          ? { ...bubble, anchor: bubble.anchor + insertion.length }
          : bubble
      ))
    })
  }

  const dividers = Array.isArray(parsed.dividers) ? parsed.dividers.map((divider, index) => ({
    ...divider,
    anchor: Math.max(0, Math.min(body.length, Number.isFinite(divider.anchor) ? divider.anchor : body.length)),
    order: Number.isFinite(divider.order) ? divider.order : index + 1,
  })) : []
  const pages = paginateText(body, options, documentFlowBlocks(speechBubbles, dividers, members, options))
  const normalized = {
    ...createDocument(),
    ...parsed,
    body,
    options,
    images: Array.isArray(parsed.images) ? parsed.images : [],
    members,
    speechBubbles: speechBubbles.map((bubble) => bubble.page === 0 ? bubble : {
      ...bubble,
      page: pageForBlock(bubble.id, pages) || pageForAnchor(bubble.anchor, pages),
    }),
    dividers,
    marks,
    footers: parsed.footers ?? {},
  }
  delete (normalized as BookDocument & { dialogueTexts?: unknown }).dialogueTexts
  return normalized
}

function loadStoredDocument(key: string) {
  const saved = localStorage.getItem(key)
  if (!saved) return null
  try {
    const parsed = JSON.parse(saved) as Partial<BookDocument>
    if (parsed.version !== 1 || typeof parsed.body !== "string" || !parsed.options) return null
    return normalizeDocument(parsed)
  } catch {
    return null
  }
}

function normalizeMembers(members: BookDocument["members"] | undefined) {
  if (!Array.isArray(members)) return []
  return members.map((member) => ({
    ...member,
    avatarScale: member.avatarScale ?? 100,
    avatarX: member.avatarX ?? 50,
    avatarY: member.avatarY ?? 50,
  }))
}

function loadLibrary() {
  const indexedSlots = loadBookSlots(localStorage)
  const slots = indexedSlots.filter((slot) => loadStoredDocument(bookStorageKey(slot.id)))
  if (slots.length) {
    if (slots.length !== indexedSlots.length) saveBookSlots(localStorage, slots)
    const requestedId = localStorage.getItem(ACTIVE_BOOK_KEY)
    const activeBookId = slots.some((slot) => slot.id === requestedId) ? requestedId! : slots[0].id
    return {
      slots,
      activeBookId,
      document: loadStoredDocument(bookStorageKey(activeBookId)) ?? createDocument(),
    }
  }

  const legacy = loadStoredDocument(LEGACY_DOCUMENT_KEY)
  if (legacy) {
    const migratedSlots = [createBookSlot(LEGACY_BOOK_ID, legacy)]
    try {
      saveBookSlots(localStorage, migratedSlots)
      localStorage.setItem(ACTIVE_BOOK_KEY, LEGACY_BOOK_ID)
    } catch {
      // The original legacy document remains intact if its metadata cannot be written.
    }
    return { slots: migratedSlots, activeBookId: LEGACY_BOOK_ID, document: legacy }
  }

  return { slots: [] as BookSlot[], activeBookId: "", document: createDocument() }
}

function loadPresets() {
  const saved = localStorage.getItem(PRESET_KEY)
  if (!saved) return []
  try {
    const parsed = JSON.parse(saved) as ThemePreset[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function imageFileToDataUrl(file: File) {
  try {
    const bitmap = await createImageBitmap(file)
    const maxEdge = 1800
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext("2d")
    if (!context) return ""
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return canvas.toDataURL("image/webp", 0.9)
  } catch {
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : ""), { once: true })
      reader.addEventListener("error", () => resolve(""), { once: true })
      reader.readAsDataURL(file)
    })
  }
}

function imageAspectRatio(src: string) {
  return new Promise<number>((resolve) => {
    const image = new Image()
    // Guard the numerator too: a dimensionless image (some SVGs) reports
    // naturalWidth 0, which would otherwise distort the avatar to ~1000% height.
    image.addEventListener("load", () => resolve((image.naturalWidth || image.naturalHeight || 1) / Math.max(1, image.naturalHeight)), { once: true })
    image.addEventListener("error", () => resolve(1), { once: true })
    image.src = src
  })
}

function removeBodyRanges(documentState: BookDocument, ranges: Array<{ start: number; end: number }>) {
  const mergedRanges = [...ranges]
    .sort((left, right) => left.start - right.start)
    .reduce<Array<{ start: number; end: number }>>((merged, range) => {
      const previous = merged.at(-1)
      if (!previous || range.start > previous.end) return [...merged, range]
      previous.end = Math.max(previous.end, range.end)
      return merged
    }, [])
  const body = mergedRanges.reduceRight((text, range) => `${text.slice(0, range.start)}${text.slice(range.end)}`, documentState.body)
  const mapOffset = (offset: number) => offset - mergedRanges.reduce((removed, range) => removed + Math.max(0, Math.min(offset, range.end) - range.start), 0)
  const marks = documentState.marks.flatMap((mark) => {
    const segments = mergedRanges.reduce<Array<{ start: number; end: number }>>((current, range) => current.flatMap((segment) => {
      if (range.end <= segment.start || range.start >= segment.end) return segment
      return [
        { start: segment.start, end: Math.min(segment.end, range.start) },
        { start: Math.max(segment.start, range.end), end: segment.end },
      ].filter((part) => part.start < part.end)
    }), [{ start: mark.start, end: mark.end }])
    return segments.map((segment, index) => ({
      ...mark,
      id: index ? crypto.randomUUID() : mark.id,
      start: mapOffset(segment.start),
      end: mapOffset(segment.end),
    }))
  })
  return { body, marks, mapOffset }
}

function downloadBookFile(documentState: BookDocument) {
  const link = document.createElement("a")
  const safeTitle = documentState.title.replace(/[\\/:*?"<>|]/g, "-") || "hamster-book"
  link.download = `${safeTitle}.hamsterbook`
  link.href = URL.createObjectURL(new Blob([JSON.stringify(documentState, null, 2)], { type: "application/x-hamster-book+json" }))
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

export default function App() {
  const [initialLibrary] = useState(loadLibrary)
  const [documentState, setDocumentState] = useState(initialLibrary.document)
  const [screen, setScreen] = useState<"home" | "editor">("home")
  const [bookSlots, setBookSlots] = useState(initialLibrary.slots)
  const [activeBookId, setActiveBookId] = useState(initialLibrary.activeBookId)
  const [activeTab, setActiveTab] = useState<EditorTab>("manuscript")
  const [selectedPage, setSelectedPage] = useState(documentState.options.coverMode === "none" ? 1 : 0)
  const [selectedPages, setSelectedPages] = useState(() => [documentState.options.coverMode === "none" ? 1 : 0])
  const [selectedImageId, setSelectedImageId] = useState("")
  const [selectedBubbleId, setSelectedBubbleId] = useState("")
  const [selectedDividerId, setSelectedDividerId] = useState("")
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null)
  const [pendingCaret, setPendingCaret] = useState<{ offset: number; beforeBlockId: string | null } | null>(null)
  const [transformMode, setTransformMode] = useState(true)
  const [customPresets, setCustomPresets] = useState(loadPresets)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [exporting, setExporting] = useState(false)
  const past = useRef<BookDocument[]>([])
  const future = useRef<BookDocument[]>([])
  const transientStart = useRef<BookDocument | null>(null)
  const transientChanged = useRef(false)
  const saveErrorNotified = useRef(false)
  const documentRef = useRef(documentState)
  const bookSlotsRef = useRef(bookSlots)
  const [, refreshHistory] = useReducer((value: number) => value + 1, 0)

  useEffect(() => {
    documentRef.current = documentState
  }, [documentState])

  useEffect(() => {
    bookSlotsRef.current = bookSlots
  }, [bookSlots])

  const notify = useCallback((message: string, tone: ToastState["tone"] = "default") => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 2600)
  }, [])
  const clearPendingCaret = useCallback(() => setPendingCaret(null), [])

  const commit = useCallback((update: (current: BookDocument) => BookDocument) => {
    setDocumentState((current) => {
      past.current = [...past.current.slice(-79), current]
      future.current = []
      return { ...update(current), updatedAt: new Date().toISOString() }
    })
    refreshHistory()
  }, [])

  const persistBook = useCallback((id: string, nextDocument: BookDocument) => {
    const nextSlots = upsertBookSlot(bookSlotsRef.current, id, nextDocument)
    localStorage.setItem(bookStorageKey(id), JSON.stringify(nextDocument))
    saveBookSlots(localStorage, nextSlots)
    localStorage.setItem(ACTIVE_BOOK_KEY, id)
    bookSlotsRef.current = nextSlots
    setBookSlots(nextSlots)
  }, [])

  const updateTransient = useCallback((update: (current: BookDocument) => BookDocument) => {
    setDocumentState((current) => {
      const next = update(current)
      // Only flag a history entry when the document actually changed, so no-op
      // transient interactions don't create phantom undo steps.
      if (next !== current) transientChanged.current = true
      return next
    })
  }, [])

  const beginTransient = useCallback(() => {
    if (transientStart.current) return
    transientStart.current = documentRef.current
    transientChanged.current = false
  }, [])

  const endTransient = useCallback(() => {
    if (!transientStart.current) return
    if (!transientChanged.current) {
      transientStart.current = null
      return
    }
    past.current = [...past.current.slice(-79), transientStart.current]
    future.current = []
    transientStart.current = null
    transientChanged.current = false
    refreshHistory()
  }, [])

  const undo = useCallback(() => {
    const previous = past.current.at(-1)
    if (!previous) return
    setPendingCaret(null)
    past.current = past.current.slice(0, -1)
    future.current = [documentRef.current, ...future.current].slice(0, 80)
    setDocumentState(previous)
    refreshHistory()
  }, [])

  const redo = useCallback(() => {
    const next = future.current[0]
    if (!next) return
    setPendingCaret(null)
    future.current = future.current.slice(1)
    past.current = [...past.current.slice(-79), documentRef.current]
    setDocumentState(next)
    refreshHistory()
  }, [])

  useEffect(() => {
    if (screen !== "editor" || !activeBookId) return
    setSaveStatus("saving")
    const timeout = window.setTimeout(() => {
      try {
        persistBook(activeBookId, documentState)
        setSaveStatus("saved")
        saveErrorNotified.current = false
      } catch {
        setSaveStatus("error")
        // Alert once when saving starts failing so edits aren't silently lost
        // (localStorage is full — usually too many/large images).
        if (!saveErrorNotified.current) {
          saveErrorNotified.current = true
          notify("저장 공간이 가득 찼어요. 변경사항이 안 담길 수 있으니 작업 파일로 내보내 주세요.", "warn")
        }
      }
    }, 420)
    return () => window.clearTimeout(timeout)
  }, [activeBookId, documentState, notify, persistBook, screen])

  useEffect(() => {
    localStorage.setItem(PRESET_KEY, JSON.stringify(customPresets))
  }, [customPresets])

  const flowBlocks = useMemo(
    () => documentFlowBlocks(documentState.speechBubbles, documentState.dividers, documentState.members, documentState.options),
    [documentState.dividers, documentState.members, documentState.options, documentState.speechBubbles],
  )
  const pages = useMemo(() => paginateText(documentState.body, documentState.options, flowBlocks), [documentState.body, documentState.options, flowBlocks])
  const maxPage = pages.length
  const selectedImage = documentState.images.find((image) => image.id === selectedImageId) ?? null
  const selectedBubble = documentState.speechBubbles.find((bubble) => bubble.id === selectedBubbleId) ?? null
  const selectedDivider = documentState.dividers.find((divider) => divider.id === selectedDividerId) ?? null

  useEffect(() => {
    const fallback = selectedPage > maxPage || (selectedPage === 0 && documentState.options.coverMode === "none") ? Math.max(1, maxPage) : selectedPage
    if (fallback !== selectedPage) setSelectedPage(fallback)
    setSelectedPages((current) => {
      const valid = current.filter((page) => page <= maxPage && (page !== 0 || documentState.options.coverMode !== "none"))
      if (valid.length && valid.length === current.length) return current
      return valid.length ? valid : [fallback]
    })
  }, [documentState.options.coverMode, maxPage, selectedPage])

  const deleteSelectedPages = useCallback(() => {
    const pageNumbers = [...selectedPages].sort((left, right) => left - right)
    if (!pageNumbers.length) return
    setPendingCaret(null)
    const contentPages = pageNumbers.filter((page) => page > 0)
    // Group consecutive pages into runs and drop at most ONE adjacent page break
    // per run. A per-page heuristic would strip both the leading and trailing
    // break of an auto-flowed section, wrongly merging its neighbours.
    const runs = contentPages.reduce<number[][]>((groups, page) => {
      const last = groups.at(-1)
      if (last && page === last.at(-1)! + 1) last.push(page)
      else groups.push([page])
      return groups
    }, [])
    const ranges = runs.map((run) => {
      const first = pages[run[0] - 1]
      const last = pages[run.at(-1)! - 1]
      if (!first || !last) return null
      let start = first.start
      let end = last.end
      if (documentState.body[end] === PAGE_BREAK) end += 1
      else if (start > 0 && documentState.body[start - 1] === PAGE_BREAK) start -= 1
      return { start, end }
    }).filter((range): range is { start: number; end: number } => range !== null)
    const removed = new Set(pageNumbers)
    const remapPage = (page: number) => page === 0 ? 0 : page - contentPages.filter((deleted) => deleted < page).length
    commit((current) => {
      const text = removeBodyRanges(current, ranges)
      const options = pageNumbers.includes(0) ? { ...current.options, coverMode: "none" as const } : current.options
      const speechBubbles = current.speechBubbles
        .filter((bubble) => !removed.has(bubble.page === 0 ? 0 : pageForBlock(bubble.id, pages)))
        .map((bubble) => ({ ...bubble, anchor: text.mapOffset(bubble.anchor) }))
      const dividers = current.dividers
        .filter((divider) => !removed.has(pageForBlock(divider.id, pages)))
        .map((divider) => ({ ...divider, anchor: text.mapOffset(divider.anchor) }))
      const nextPages = paginateText(text.body, options, documentFlowBlocks(speechBubbles, dividers, current.members, options))
      return {
        ...current,
        body: text.body,
        marks: text.marks,
        options,
        images: current.images.filter((image) => !removed.has(image.page)).map((image) => ({ ...image, page: Math.min(remapPage(image.page), nextPages.length) })),
        speechBubbles: speechBubbles.map((bubble) => bubble.page === 0 ? bubble : {
          ...bubble,
          page: pageForBlock(bubble.id, nextPages) || pageForAnchor(bubble.anchor, nextPages),
        }),
        dividers,
        footers: Object.fromEntries(Object.entries(current.footers)
          .filter(([page]) => !removed.has(Number(page)))
          .map(([page, footer]) => [remapPage(Number(page)), footer])),
      }
    })
    const nextPage = Math.min(contentPages[0] ?? 1, Math.max(1, pages.length - contentPages.length))
    setSelectedPage(nextPage)
    setSelectedPages([nextPage])
    setSelectedImageId("")
    setSelectedBubbleId("")
    setSelectedDividerId("")
    setTextSelection(null)
    const message = pageNumbers.length > 1
      ? `${pageNumbers.length}개 페이지를 지웠어요.`
      : pageNumbers[0] === 0
        ? "표지를 지웠어요."
        : pages.length === 1
          ? "마지막 본문 페이지를 비웠어요."
          : `${pageNumbers[0]}쪽을 지웠어요.`
    notify(`${message} 실행 취소로 되돌릴 수 있어요.`, "success")
  }, [commit, documentState.body, notify, pages, selectedPages])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey
      const target = event.target as HTMLElement
      const editingText = Boolean(target.closest("input, textarea, [contenteditable]"))
      const flowEditor = target.closest<HTMLElement>("[data-flow-text-segment]")
      if (modifier && event.key.toLowerCase() === "z") {
        if (flowEditor) {
          event.preventDefault()
          flowEditor.blur()
          if (event.shiftKey) redo()
          else undo()
          return
        }
        if (editingText) return
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (modifier && event.key.toLowerCase() === "y") {
        if (flowEditor) {
          event.preventDefault()
          flowEditor.blur()
          redo()
          return
        }
        if (editingText) return
        event.preventDefault()
        redo()
        return
      }
      if (modifier && event.key.toLowerCase() === "t" && selectedImageId) {
        event.preventDefault()
        setTransformMode((current) => !current)
        return
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedPages.length > 1 && !target.closest("input, textarea, [contenteditable]")) {
        event.preventDefault()
        deleteSelectedPages()
        return
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedImageId && !target.closest("input, textarea, [contenteditable]")) {
        event.preventDefault()
        commit((current) => ({ ...current, images: current.images.filter((image) => image.id !== selectedImageId) }))
        setSelectedImageId("")
        return
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedBubbleId && !target.closest("input, textarea, [contenteditable]")) {
        event.preventDefault()
        commit((current) => ({
          ...current,
          speechBubbles: current.speechBubbles.filter((bubble) => bubble.id !== selectedBubbleId),
        }))
        setSelectedBubbleId("")
        return
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedDividerId && !target.closest("input, textarea, [contenteditable]")) {
        event.preventDefault()
        commit((current) => ({ ...current, dividers: current.dividers.filter((divider) => divider.id !== selectedDividerId) }))
        setSelectedDividerId("")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [commit, deleteSelectedPages, redo, selectedBubbleId, selectedDividerId, selectedImageId, selectedPages.length, undo])

  const patchOptions = (patch: Partial<BookOptions>) => {
    commit((current) => ({ ...current, options: { ...current.options, ...patch } }))
  }

  const addPage = () => {
    const nextPage = maxPage + 1
    commit((current) => ({ ...current, body: `${current.body}${PAGE_BREAK}` }))
    setSelectedPage(nextPage)
    setSelectedPages([nextPage])
    setSelectedImageId("")
    setSelectedBubbleId("")
    setSelectedDividerId("")
    setTextSelection(null)
    notify(`${nextPage}쪽을 추가했어요.`, "success")
    window.requestAnimationFrame(() => {
      window.document.querySelector(`[data-page-index="${nextPage}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }

  const replacePageText = (
    start: number,
    end: number,
    text: string,
    followingBlockIds: string[],
    caret?: { offset: number; beforeBlockId: string | null },
  ) => {
    if (caret !== undefined) setPendingCaret(caret)
    updateTransient((current) => {
      if (current.body.slice(start, end) === text) return current
      const delta = text.length - (end - start)
      const following = new Set(followingBlockIds)
      const body = `${current.body.slice(0, start)}${text}${current.body.slice(end)}`
      const order = new Map(current.speechBubbles
        .filter((bubble) => bubble.page > 0)
        .sort((left, right) => left.anchor - right.anchor || left.zIndex - right.zIndex)
        .map((bubble, index) => [bubble.id, index + 1]))
      const speechBubbles = current.speechBubbles.map((bubble) => {
        if (bubble.page === 0) return bubble
        const shift = bubble.anchor > end || (bubble.anchor === end && following.has(bubble.id))
        return {
          ...bubble,
          anchor: shift ? Math.max(0, bubble.anchor + delta) : bubble.anchor,
          zIndex: order.get(bubble.id) ?? bubble.zIndex,
        }
      })
      const dividers = current.dividers.map((divider) => ({
        ...divider,
        anchor: divider.anchor > end || (divider.anchor === end && following.has(divider.id))
          ? Math.max(0, divider.anchor + delta)
          : divider.anchor,
      }))
      const nextPages = paginateText(body, current.options, documentFlowBlocks(speechBubbles, dividers, current.members, current.options))
      return {
        ...current,
        body,
        speechBubbles: speechBubbles.map((bubble) => bubble.page === 0 ? bubble : {
          ...bubble,
          page: pageForBlock(bubble.id, nextPages) || pageForAnchor(bubble.anchor, nextPages),
        }),
        dividers,
        marks: current.marks.flatMap((mark) => {
          if (mark.end <= start) return mark
          if (mark.start >= end) return { ...mark, start: mark.start + delta, end: mark.end + delta }
          // A pure insertion inside a mark grows it; otherwise keep the mark's
          // surviving prefix/suffix instead of dropping the whole mark.
          if (start === end) return { ...mark, end: mark.end + delta }
          const parts: Array<{ start: number; end: number }> = []
          if (mark.start < start) parts.push({ start: mark.start, end: start })
          if (mark.end > end) parts.push({ start: end + delta, end: mark.end + delta })
          return parts.filter((part) => part.end > part.start).map((part, index) => ({
            ...mark,
            id: index ? crypto.randomUUID() : mark.id,
            start: part.start,
            end: part.end,
          }))
        }),
      }
    })
  }

  const addImage = async (file: File, page = selectedPage) => {
    const src = await imageFileToDataUrl(file)
    if (!src) {
      notify("이미지를 읽지 못했어요.", "warn")
      return
    }
    const aspectRatio = await imageAspectRatio(src)
    const fitted = fitImageToPage(aspectRatio)
    const id = crypto.randomUUID()
    commit((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          id,
          page,
          src,
          name: file.name,
          ...fitted,
          opacity: 1,
          zIndex: Math.max(0, ...current.images.map((image) => image.zIndex)) + 1,
          aspectRatio,
        },
      ],
    }))
    setSelectedPage(page)
    setSelectedImageId(id)
    setSelectedBubbleId("")
    setSelectedDividerId("")
    setActiveTab("image")
    notify("사진을 페이지에 콕 놓았어요.", "success")
  }

  const patchImage = (id: string, patch: Partial<ImageLayer>, transient = false) => {
    const update = (current: BookDocument) => ({
      ...current,
      images: current.images.map((image) => image.id === id ? { ...image, ...patch } : image),
    })
    if (transient) updateTransient(update)
    else commit(update)
  }

  const deleteImage = (id = selectedImageId) => {
    if (!id) return
    commit((current) => ({ ...current, images: current.images.filter((image) => image.id !== id) }))
    setSelectedImageId("")
    notify("이미지를 지웠어요.")
  }

  const addMember = () => {
    const id = crypto.randomUUID()
    const colors = ["#ff777b", "#9ff0c4", "#f2cf68", "#a8d8f0", "#dfb8ec"]
    commit((current) => ({
      ...current,
      members: [
        ...current.members,
        {
          id,
          name: `멤버 ${current.members.length + 1}`,
          avatar: "",
          avatarScale: 100,
          avatarX: 50,
          avatarY: 50,
          bubbleColor: colors[current.members.length % colors.length],
          textColor: "#292725",
        },
      ],
    }))
    return id
  }

  const patchMember = (id: string, patch: Partial<MemberProfile>) => {
    commit((current) => ({
      ...current,
      members: current.members.map((member) => member.id === id ? { ...member, ...patch } : member),
    }))
  }

  const setMemberAvatar = async (id: string, file: File) => {
    const avatar = await imageFileToDataUrl(file)
    if (!avatar) {
      notify("프로필 사진을 읽지 못했어요.", "warn")
      return
    }
    const avatarAspectRatio = await imageAspectRatio(avatar)
    patchMember(id, { avatar, avatarAspectRatio, avatarScale: 100, avatarX: 50, avatarY: 50 })
  }

  const deleteMemberAvatar = (id: string) => {
    patchMember(id, { avatar: "", avatarAspectRatio: undefined, avatarScale: 100, avatarX: 50, avatarY: 50 })
    notify("프로필 사진을 지웠어요.")
  }

  const deleteMember = (id: string) => {
    commit((current) => {
      const member = current.members.find((item) => item.id === id)
      return {
        ...current,
        members: current.members.filter((item) => item.id !== id),
        speechBubbles: current.speechBubbles.map((bubble) => bubble.profileId === id ? {
          ...bubble,
          profileId: "",
          speakerName: member?.name ?? bubble.speakerName,
          bubbleColor: member?.bubbleColor ?? bubble.bubbleColor,
          textColor: member?.textColor ?? bubble.textColor,
        } : bubble),
      }
    })
    notify("멤버를 지웠어요. 기존 말풍선은 텍스트로 남겨 두었어요.")
  }

  const addBubble = (profileId: string, text: string, secondaryText: string, side: SpeechBubble["side"]) => {
    const member = documentRef.current.members.find((item) => item.id === profileId)
    if (!member) return
    const id = crypto.randomUUID()
    commit((current) => {
      const count = current.speechBubbles.filter((bubble) => bubble.page === 0 ? selectedPage === 0 : selectedPage > 0).length
      const page = pages[Math.max(0, selectedPage - 1)]
      const selectionAnchor = textSelection && page && textSelection.start >= page.start && textSelection.start <= page.end
        ? textSelection.start
        : page?.end ?? current.body.length
      return {
        ...current,
        speechBubbles: [
          ...current.speechBubbles,
          {
            id,
            page: selectedPage,
            anchor: selectedPage === 0 ? 0 : selectionAnchor,
            profileId,
            speakerName: member.name,
            text,
            secondaryText,
            x: side === "left" ? 10 : 38,
            y: 18 + (count * 10) % 54,
            width: 52,
            autoWidth: true,
            textScale: 100,
            secondaryTextScale: 100,
            showName: true,
            side,
            bubbleColor: member.bubbleColor,
            textColor: member.textColor,
            zIndex: Math.max(0, ...current.images.map((image) => image.zIndex), ...current.speechBubbles.map((bubble) => bubble.zIndex)) + 1,
          },
        ],
      }
    })
    setSelectedImageId("")
    setSelectedBubbleId(id)
    setSelectedDividerId("")
    setActiveTab("dialogue")
    notify("말풍선을 현재 페이지에 놓았어요.", "success")
  }

  const addDivider = (style: DividerStyle, color: string) => {
    const id = crypto.randomUUID()
    const page = pages[Math.max(0, selectedPage - 1)]
    const anchor = textSelection && page && textSelection.start >= page.start && textSelection.start <= page.end
      ? textSelection.start
      : page?.end ?? documentRef.current.body.length
    commit((current) => ({
      ...current,
      dividers: [...current.dividers, {
        id,
        anchor,
        style,
        color,
        order: Math.max(0, ...current.dividers.map((divider) => divider.order)) + 1,
      }],
    }))
    setSelectedDividerId(id)
    setSelectedBubbleId("")
    setSelectedImageId("")
    notify("구분선을 커서 위치에 넣었어요.", "success")
  }

  const patchDivider = (id: string, patch: Partial<DividerBlock>) => {
    commit((current) => ({
      ...current,
      dividers: current.dividers.map((divider) => divider.id === id ? { ...divider, ...patch } : divider),
    }))
  }

  const deleteDivider = (id = selectedDividerId) => {
    if (!id) return
    commit((current) => ({ ...current, dividers: current.dividers.filter((divider) => divider.id !== id) }))
    setSelectedDividerId("")
    notify("구분선을 지웠어요.")
  }

  const patchBubble = (id: string, patch: Partial<SpeechBubble>, transient = false) => {
    const update = (current: BookDocument) => {
      const speechBubbles = current.speechBubbles.map((bubble) => {
        if (bubble.id !== id) return bubble
        const member = patch.profileId ? current.members.find((item) => item.id === patch.profileId) : null
        return {
          ...bubble,
          ...patch,
          ...(member ? { speakerName: member.name, bubbleColor: member.bubbleColor, textColor: member.textColor } : {}),
        }
      })
      const nextPages = paginateText(current.body, current.options, documentFlowBlocks(speechBubbles, current.dividers, current.members, current.options))
      return {
        ...current,
        speechBubbles: speechBubbles.map((bubble) => bubble.page === 0 ? bubble : {
          ...bubble,
          page: pageForBlock(bubble.id, nextPages) || pageForAnchor(bubble.anchor, nextPages),
        }),
      }
    }
    if (transient) updateTransient(update)
    else commit(update)
  }

  const moveBubble = (id: string, direction: -1 | 1) => {
    commit((current) => {
      const speechBubbles = moveSpeechBubble(current.speechBubbles, id, direction)
      if (speechBubbles === current.speechBubbles) return current
      const nextPages = paginateText(current.body, current.options, documentFlowBlocks(speechBubbles, current.dividers, current.members, current.options))
      return {
        ...current,
        speechBubbles: speechBubbles.map((bubble) => bubble.page === 0 ? bubble : {
          ...bubble,
          page: pageForBlock(bubble.id, nextPages) || pageForAnchor(bubble.anchor, nextPages),
        }),
      }
    })
  }

  const deleteBubble = (id = selectedBubbleId) => {
    if (!id) return
    commit((current) => ({
      ...current,
      speechBubbles: current.speechBubbles.filter((bubble) => bubble.id !== id),
    }))
    setSelectedBubbleId("")
    notify("말풍선을 지웠어요.")
  }

  const insertTextAfterBubble = (id = selectedBubbleId) => {
    const current = documentRef.current
    const bubble = current.speechBubbles.find((item) => item.id === id)
    if (!bubble || bubble.page === 0) return
    const globalOrder = [
      ...current.speechBubbles.filter((item) => item.page > 0).map((item) => ({ id: item.id, anchor: item.anchor, order: item.zIndex, rank: 0 })),
      ...current.dividers.map((divider) => ({ id: divider.id, anchor: divider.anchor, order: divider.order, rank: 1 })),
    ].sort((left, right) => left.anchor - right.anchor || left.rank - right.rank || left.order - right.order)
    const next = globalOrder[globalOrder.findIndex((item) => item.id === id) + 1] ?? null
    setPendingCaret({ offset: bubble.anchor, beforeBlockId: next ? next.id : null })
    notify("말풍선 사이에 바로 글을 쓸 수 있어요.", "success")
  }

  const addMark = (start: number, end: number, kind: MarkKind, value: string) => {
    if (start === end) {
      notify("본문에서 꾸밀 글자를 먼저 드래그해 주세요.", "warn")
      return
    }
    const range = { start: Math.min(start, end), end: Math.max(start, end) }
    commit((current) => {
      const same = current.marks.some((mark) => mark.start === range.start && mark.end === range.end && mark.kind === kind && mark.value === value)
      const marks = current.marks.filter((mark) => mark.start !== range.start || mark.end !== range.end || mark.kind !== kind)
      if (same) return { ...current, marks }
      return { ...current, marks: [...marks, { id: crypto.randomUUID(), ...range, kind, value }] }
    })
  }

  const currentFooter = documentState.footers[selectedPage] ?? {
    title: documentState.title,
    subtitle: "",
    color: documentState.options.textColor,
    italic: false,
    weight: 400,
  }

  const patchFooter = (patch: Partial<FooterNote>) => {
    commit((current) => ({
      ...current,
      footers: { ...current.footers, [selectedPage]: { ...currentFooter, ...patch } },
    }))
  }

  const applyFooterAll = () => {
    const pageNumbers = Array.from({ length: pages.length }, (_, index) => index + 1)
    if (documentState.options.coverMode !== "none") pageNumbers.unshift(0)
    commit((current) => ({
      ...current,
      footers: Object.fromEntries(pageNumbers.map((page) => [page, currentFooter])),
    }))
    notify("모든 페이지에 발도장을 찍었어요.", "success")
  }

  const deleteFooter = (all: boolean) => {
    commit((current) => {
      if (all) return { ...current, footers: {} }
      const footers = { ...current.footers }
      delete footers[selectedPage]
      return { ...current, footers }
    })
  }

  const applyTheme = (theme: ThemePreset) => {
    commit((current) => ({
      ...current,
      options: { ...current.options, ...theme.options, themeId: theme.id },
    }))
    notify(`'${theme.name}' 이불을 덮었어요.`, "success")
  }

  const savePreset = (name: string) => {
    if (!name.trim()) {
      notify("저장할 테마 이름을 입력해 주세요.", "warn")
      return
    }
    const preset: ThemePreset = {
      id: `custom-${crypto.randomUUID()}`,
      name: name.trim(),
      description: "내가 저장한 지면 설정",
      colors: [documentState.options.backgroundColor, documentState.options.quoteColor, documentState.options.bracketColor],
      options: { ...documentState.options, coverImage: "" },
    }
    setCustomPresets((current) => [...current, preset])
    notify("현재 설정을 이불로 저장했어요.", "success")
  }

  const uploadCover = async (file: File) => {
    const coverImage = await imageFileToDataUrl(file)
    if (!coverImage) return
    patchOptions({ coverImage, coverMode: documentState.options.coverMode === "none" ? "image-text" : documentState.options.coverMode })
  }

  const activateBook = (id: string, nextDocument: BookDocument, message: string) => {
    const firstPage = nextDocument.options.coverMode === "none" ? 1 : 0
    past.current = []
    future.current = []
    transientStart.current = null
    transientChanged.current = false
    setActiveBookId(id)
    setDocumentState(nextDocument)
    setSelectedPage(firstPage)
    setSelectedPages([firstPage])
    setSelectedImageId("")
    setSelectedBubbleId("")
    setSelectedDividerId("")
    setTextSelection(null)
    setActiveTab("manuscript")
    setMobilePanelOpen(false)
    setScreen("editor")
    notify(message, "success")
    refreshHistory()
  }

  const saveTemporary = () => {
    try {
      if (!activeBookId) throw new Error("missing book")
      persistBook(activeBookId, documentState)
      setSaveStatus("saved")
      notify("브라우저에 폭신하게 담아뒀어요.", "success")
    } catch {
      notify("브라우저 저장 공간이 부족해요. 작업 파일로 보관해 주세요.", "warn")
    }
  }

  const importProject = async (file: File) => {
    let imported: BookDocument
    try {
      const parsed = JSON.parse(await file.text()) as BookDocument
      if (parsed.version !== 1 || typeof parsed.body !== "string" || !parsed.options) throw new Error("invalid")
      imported = { ...normalizeDocument(parsed), updatedAt: new Date().toISOString() }
    } catch {
      notify("이 앱에서 만든 작업 파일인지 확인해 주세요.", "warn")
      return
    }
    try {
      const id = `book-${crypto.randomUUID()}`
      persistBook(id, imported)
      activateBook(id, imported, "작업 파일을 새 책으로 불러왔어요.")
    } catch {
      notify("불러왔지만 브라우저 저장 공간이 부족해 담아두지 못했어요. 이미지 수를 줄여 주세요.", "warn")
    }
  }

  const runExport = async (mode: ExportMode) => {
    setExporting(true)
    notify("페이지를 이미지로 만들고 있어요.")
    try {
      await exportBook(mode, selectedPage, documentState.title)
      notify("이미지 저장을 시작했어요.", "success")
    } catch {
      notify("이미지를 저장하지 못했어요. 외부 이미지나 글꼴을 확인해 주세요.", "warn")
    } finally {
      setExporting(false)
    }
  }

  const copySelectedPage = async () => {
    setExporting(true)
    notify("선택한 페이지를 복사하고 있어요.")
    try {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
      await copyBookPage(selectedPage)
      notify("페이지를 이미지로 복사했어요. 업로드 창에 붙여넣어 보세요.", "success")
    } catch {
      notify("이 브라우저에서는 이미지 복사가 허용되지 않았어요. HTTPS 페이지에서 다시 시도해 주세요.", "warn")
    } finally {
      setExporting(false)
    }
  }

  const selectTool = (tab: EditorTab) => {
    setActiveTab(tab)
    setMobilePanelOpen((open) => tab === activeTab ? !open : true)
  }

  const selectPage = (page: number, additive = false) => {
    if (additive) {
      const next = selectedPages.includes(page)
        ? selectedPages.length === 1 ? selectedPages : selectedPages.filter((selected) => selected !== page)
        : [...selectedPages, page].sort((left, right) => left - right)
      setSelectedPages(next)
      setSelectedPage(next.includes(page) ? page : next.at(-1) ?? page)
      setSelectedImageId("")
      setSelectedBubbleId("")
      setSelectedDividerId("")
      setTextSelection(null)
      return
    }
    if (page !== selectedPage || page === 0) setTextSelection(null)
    setSelectedPage(page)
    setSelectedPages([page])
    const selectedBelongsElsewhere = selectedImage && selectedImage.page !== page
    if (selectedBelongsElsewhere) setSelectedImageId("")
    const selectedBubblePage = selectedBubble?.page === 0 ? 0 : selectedBubble ? pageForBlock(selectedBubble.id, pages) : -1
    const bubbleBelongsElsewhere = selectedBubble && selectedBubblePage !== page
    if (bubbleBelongsElsewhere) setSelectedBubbleId("")
    const dividerPage = selectedDivider ? pageForBlock(selectedDivider.id, pages) : -1
    if (selectedDivider && dividerPage !== page) setSelectedDividerId("")
  }

  const pageCount = pages.length + (documentState.options.coverMode === "none" ? 0 : 1)
  const mascotMessage = toast?.message ?? (saveStatus === "saving" ? "문장을 포개는 중…" : saveStatus === "error" ? "작업 파일로 보관해 주세요" : "굴 안에 잘 담아뒀어요")

  const createNewBook = () => {
    const next = createDocument()
    next.title = "제목 없는 책"
    next.body = ""
    next.options = { ...next.options, coverTitle: "제목 없는 책", coverSubtitle: "" }
    const id = `book-${crypto.randomUUID()}`
    try {
      persistBook(id, next)
      activateBook(id, next, "새 이불을 폈어요. 첫 문장을 적어볼까요?")
    } catch {
      notify("브라우저 저장 공간이 부족해 새 책을 만들지 못했어요.", "warn")
    }
  }

  const openBook = (id: string) => {
    const saved = loadStoredDocument(bookStorageKey(id))
    if (!saved) {
      notify("이 책의 저장 내용을 찾지 못했어요.", "warn")
      return
    }
    localStorage.setItem(ACTIVE_BOOK_KEY, id)
    activateBook(id, saved, "이어서 폭신하게 써 볼까요?")
  }

  const continueDraft = () => {
    const id = bookSlots.some((slot) => slot.id === activeBookId) ? activeBookId : bookSlots[0]?.id
    if (id) openBook(id)
  }

  const deleteBook = (id: string) => {
    const slot = bookSlotsRef.current.find((book) => book.id === id)
    if (!slot || !window.confirm(`'${slot.title}'을(를) 책장에서 삭제할까요?`)) return
    const nextSlots = bookSlotsRef.current.filter((book) => book.id !== id)
    try {
      saveBookSlots(localStorage, nextSlots)
      localStorage.removeItem(bookStorageKey(id))
      bookSlotsRef.current = nextSlots
      setBookSlots(nextSlots)
      if (id === activeBookId) {
        const nextActiveId = nextSlots[0]?.id ?? ""
        setActiveBookId(nextActiveId)
        if (nextActiveId) {
          localStorage.setItem(ACTIVE_BOOK_KEY, nextActiveId)
          setDocumentState(loadStoredDocument(bookStorageKey(nextActiveId)) ?? createDocument())
        } else {
          localStorage.removeItem(ACTIVE_BOOK_KEY)
          setDocumentState(createDocument())
        }
      }
      notify("책장에서 한 권을 비웠어요.", "success")
    } catch {
      notify("책을 삭제하지 못했어요. 다시 시도해 주세요.", "warn")
    }
  }

  const returnHome = () => {
    try {
      if (activeBookId) persistBook(activeBookId, documentState)
    } catch {
      setSaveStatus("error")
    }
    setMobilePanelOpen(false)
    setScreen("home")
  }

  if (screen === "home") {
    return (
      <HomeScreen
        books={bookSlots}
        activeBookId={activeBookId}
        onNew={createNewBook}
        onContinue={continueDraft}
        onOpen={openBook}
        onDelete={deleteBook}
        onImport={importProject}
      />
    )
  }

  return (
    <main className={mobilePanelOpen ? "app-shell mobile-panel-open" : "app-shell"}>
      <ToolRail
        active={activeTab}
        canUndo={past.current.length > 0}
        canRedo={future.current.length > 0}
        onSelect={selectTool}
        onUndo={undo}
        onRedo={redo}
      />
      <Inspector
        document={documentState}
        activeTab={activeTab}
        selectedPage={selectedPage}
        selectedImage={selectedImage}
        selectedBubble={selectedBubble}
        selectedDivider={selectedDivider}
        textSelection={textSelection}
        members={documentState.members}
        customPresets={customPresets}
        onClose={() => setMobilePanelOpen(false)}
        onSetTitle={(title) => commit((current) => ({ ...current, title }))}
        onPatchOptions={patchOptions}
        onApplyTheme={applyTheme}
        onSavePreset={savePreset}
        onDeletePreset={(id) => setCustomPresets((current) => current.filter((preset) => preset.id !== id))}
        onAddMark={addMark}
        onClearMarks={() => commit((current) => ({ ...current, marks: [] }))}
        onUploadCover={uploadCover}
        onAddImage={(file) => addImage(file)}
        onPatchImage={(patch) => selectedImage && patchImage(selectedImage.id, patch)}
        onDeleteImage={() => deleteImage()}
        onAddMember={addMember}
        onPatchMember={patchMember}
        onSetMemberAvatar={setMemberAvatar}
        onDeleteMemberAvatar={deleteMemberAvatar}
        onDeleteMember={deleteMember}
        onAddBubble={addBubble}
        onPatchBubble={(patch) => selectedBubble && patchBubble(selectedBubble.id, patch)}
        onMoveBubble={(direction) => selectedBubble && moveBubble(selectedBubble.id, direction)}
        onInsertTextAfterBubble={() => selectedBubble && insertTextAfterBubble(selectedBubble.id)}
        onDeleteBubble={() => deleteBubble()}
        onAddDivider={addDivider}
        onPatchDivider={(patch) => selectedDivider && patchDivider(selectedDivider.id, patch)}
        onDeleteDivider={() => deleteDivider()}
        onPatchFooter={patchFooter}
        onApplyFooterAll={applyFooterAll}
        onDeleteFooter={deleteFooter}
        onExport={runExport}
        onCopyPage={copySelectedPage}
        onSaveTemporary={saveTemporary}
        onDownloadProject={() => downloadBookFile(documentState)}
        onImportProject={importProject}
        onNotify={notify}
      />
      <section className="workspace-shell">
        <header className="workspace-header">
          <button className="mobile-menu icon-button" type="button" onClick={() => setMobilePanelOpen(true)} title="편집 도구 열기">
            <Menu aria-hidden="true" />
          </button>
          <button className="editor-home icon-button" type="button" onClick={returnHome} title="서재로 돌아가기">
            <House aria-hidden="true" />
          </button>
          {selectedPages.length > 1 ? (
            <div className="page-selection-bar" role="status">
              <strong>{selectedPages.length}쪽 선택</strong>
              <button className="selection-delete" type="button" onClick={deleteSelectedPages} title="선택 페이지 삭제">
                <Trash2 aria-hidden="true" /> <span>선택 페이지 삭제</span>
              </button>
              <button className="icon-button" type="button" onClick={() => setSelectedPages([selectedPage])} title="다중 선택 해제">
                <X aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="document-heading">
              <strong>{documentState.title || "제목 없는 책"}</strong>
            </div>
          )}
          {selectedPages.length === 1 ? (
            <button
              className="delete-page-button"
              type="button"
              onClick={deleteSelectedPages}
              title={selectedPage === 0 ? "표지 삭제" : "현재 페이지 삭제"}
            >
              <Trash2 aria-hidden="true" /> <span>{selectedPage === 0 ? "표지 삭제" : "페이지 삭제"}</span>
            </button>
          ) : null}
          <button className="add-page-button" type="button" onClick={addPage} title="마지막에 빈 페이지 추가">
            <Plus aria-hidden="true" /> <span>페이지 추가</span>
          </button>
          <div className="workspace-status">
            <span>{pageCount}장</span>
            <span className={`save-state is-${saveStatus}`}>
              {saveStatus === "saved" ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}
              {saveStatus === "saved" ? "저장됨" : saveStatus === "saving" ? "저장 중" : "저장 공간 부족"}
            </span>
          </div>
        </header>
        <div className="workspace-scroll">
          <BookCanvas
            document={documentState}
            pages={pages}
            selectedPage={selectedPage}
            selectedPages={selectedPages}
            selectedImageId={selectedImageId}
            selectedBubbleId={selectedBubbleId}
            selectedDividerId={selectedDividerId}
            pendingCaret={pendingCaret}
            transformMode={transformMode}
            onSelectPage={selectPage}
            onSelectImage={(id) => {
              setSelectedImageId(id)
              setSelectedBubbleId("")
              setSelectedDividerId("")
              setActiveTab("image")
            }}
            onSelectBubble={(id) => {
              setSelectedBubbleId(id)
              setSelectedDividerId("")
              setSelectedImageId("")
              setActiveTab("dialogue")
            }}
            onSelectDivider={(id) => {
              setSelectedDividerId(id)
              setSelectedBubbleId("")
              setSelectedImageId("")
              setActiveTab("manuscript")
            }}
            onAddImage={addImage}
            onChangeImage={(id, patch) => patchImage(id, patch, true)}
            onDeleteImage={deleteImage}
            onChangeBubble={(id, patch) => patchBubble(id, patch, true)}
            onMoveBubble={moveBubble}
            onDeleteBubble={deleteBubble}
            onDeleteDivider={deleteDivider}
            onChangePageText={replacePageText}
            onCaretRestored={clearPendingCaret}
            onSelectText={setTextSelection}
            onInteractionStart={beginTransient}
            onInteractionEnd={endTransient}
          />
        </div>
        <div className={toast ? `toast is-${toast.tone}` : "toast"} role="status">
          {toast?.message}
        </div>
        <div className="transform-status" hidden={!selectedImageId}>
          <MousePointer2 aria-hidden="true" />
          <span>{transformMode ? "변형 핸들 켜짐" : "이미지 선택됨"}</span>
          <kbd>Ctrl T</kbd>
        </div>
        <HamsterMascot message={mascotMessage} active={exporting || saveStatus === "saving"} />
      </section>
    </main>
  )
}
