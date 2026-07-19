import { Check, House, Menu, MousePointer2, Save } from "lucide-react"
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { BookCanvas } from "./components/BookCanvas"
import { HamsterMascot } from "./components/HamsterMascot"
import { HomeScreen } from "./components/HomeScreen"
import { Inspector } from "./components/Inspector"
import { ToolRail } from "./components/ToolRail"
import { DEFAULT_OPTIONS } from "./data/themes"
import { exportBook } from "./lib/export"
import { paginateText } from "./lib/pagination"
import type {
  BookDocument,
  BookOptions,
  EditorTab,
  ExportMode,
  FooterNote,
  ImageLayer,
  MarkKind,
  MemberProfile,
  SpeechBubble,
  ThemePreset,
  ToastState,
} from "./types"

const STORAGE_KEY = "hamster-private-room/document/v1"
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
    marks: [],
    footers: {},
    updatedAt: new Date().toISOString(),
  }
}

function loadDocument() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return createDocument()
  try {
    const parsed = JSON.parse(saved) as Partial<BookDocument>
    if (parsed.version !== 1 || typeof parsed.body !== "string") return createDocument()
    return {
      ...createDocument(),
      ...parsed,
      options: { ...DEFAULT_OPTIONS, ...parsed.options },
      images: Array.isArray(parsed.images) ? parsed.images : [],
      members: Array.isArray(parsed.members) ? parsed.members : [],
      speechBubbles: Array.isArray(parsed.speechBubbles) ? parsed.speechBubbles : [],
      marks: Array.isArray(parsed.marks) ? parsed.marks : [],
      footers: parsed.footers ?? {},
    }
  } catch {
    return createDocument()
  }
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

function downloadBookFile(documentState: BookDocument) {
  const link = document.createElement("a")
  const safeTitle = documentState.title.replace(/[\\/:*?"<>|]/g, "-") || "hamster-book"
  link.download = `${safeTitle}.hamsterbook`
  link.href = URL.createObjectURL(new Blob([JSON.stringify(documentState, null, 2)], { type: "application/x-hamster-book+json" }))
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

export default function App() {
  const [documentState, setDocumentState] = useState(loadDocument)
  const [screen, setScreen] = useState<"home" | "editor">("home")
  const [hasSavedDraft, setHasSavedDraft] = useState(() => Boolean(localStorage.getItem(STORAGE_KEY)))
  const [activeTab, setActiveTab] = useState<EditorTab>("manuscript")
  const [selectedPage, setSelectedPage] = useState(documentState.options.coverMode === "none" ? 1 : 0)
  const [selectedImageId, setSelectedImageId] = useState("")
  const [selectedBubbleId, setSelectedBubbleId] = useState("")
  const [transformMode, setTransformMode] = useState(true)
  const [customPresets, setCustomPresets] = useState(loadPresets)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [exporting, setExporting] = useState(false)
  const past = useRef<BookDocument[]>([])
  const future = useRef<BookDocument[]>([])
  const transientStart = useRef<BookDocument | null>(null)
  const documentRef = useRef(documentState)
  const [, refreshHistory] = useReducer((value: number) => value + 1, 0)

  useEffect(() => {
    documentRef.current = documentState
  }, [documentState])

  const notify = useCallback((message: string, tone: ToastState["tone"] = "default") => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 2600)
  }, [])

  const commit = useCallback((update: (current: BookDocument) => BookDocument) => {
    setDocumentState((current) => {
      past.current = [...past.current.slice(-79), current]
      future.current = []
      return { ...update(current), updatedAt: new Date().toISOString() }
    })
    refreshHistory()
  }, [])

  const updateTransient = useCallback((update: (current: BookDocument) => BookDocument) => {
    setDocumentState((current) => update(current))
  }, [])

  const beginTransient = useCallback(() => {
    transientStart.current ??= documentRef.current
  }, [])

  const endTransient = useCallback(() => {
    if (!transientStart.current) return
    past.current = [...past.current.slice(-79), transientStart.current]
    future.current = []
    transientStart.current = null
    refreshHistory()
  }, [])

  const undo = useCallback(() => {
    const previous = past.current.at(-1)
    if (!previous) return
    past.current = past.current.slice(0, -1)
    future.current = [documentRef.current, ...future.current].slice(0, 80)
    setDocumentState(previous)
    refreshHistory()
  }, [])

  const redo = useCallback(() => {
    const next = future.current[0]
    if (!next) return
    future.current = future.current.slice(1)
    past.current = [...past.current.slice(-79), documentRef.current]
    setDocumentState(next)
    refreshHistory()
  }, [])

  useEffect(() => {
    if (screen !== "editor") return
    setSaveStatus("saving")
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(documentState))
        setHasSavedDraft(true)
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    }, 420)
    return () => window.clearTimeout(timeout)
  }, [documentState, screen])

  useEffect(() => {
    localStorage.setItem(PRESET_KEY, JSON.stringify(customPresets))
  }, [customPresets])

  const pages = useMemo(() => paginateText(documentState.body, documentState.options), [documentState.body, documentState.options])
  const maxPage = pages.length
  const selectedImage = documentState.images.find((image) => image.id === selectedImageId) ?? null
  const selectedBubble = documentState.speechBubbles.find((bubble) => bubble.id === selectedBubbleId) ?? null

  useEffect(() => {
    if (selectedPage > maxPage) setSelectedPage(maxPage)
    if (selectedPage === 0 && documentState.options.coverMode === "none") setSelectedPage(1)
  }, [documentState.options.coverMode, maxPage, selectedPage])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault()
        redo()
        return
      }
      if (modifier && event.key.toLowerCase() === "t" && selectedImageId) {
        event.preventDefault()
        setTransformMode((current) => !current)
        return
      }
      const target = event.target as HTMLElement
      if ((event.key === "Delete" || event.key === "Backspace") && selectedImageId && !target.closest("input, textarea, [contenteditable]")) {
        event.preventDefault()
        commit((current) => ({ ...current, images: current.images.filter((image) => image.id !== selectedImageId) }))
        setSelectedImageId("")
        return
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedBubbleId && !target.closest("input, textarea, [contenteditable]")) {
        event.preventDefault()
        commit((current) => ({ ...current, speechBubbles: current.speechBubbles.filter((bubble) => bubble.id !== selectedBubbleId) }))
        setSelectedBubbleId("")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [commit, redo, selectedBubbleId, selectedImageId, undo])

  const patchOptions = (patch: Partial<BookOptions>) => {
    commit((current) => ({ ...current, options: { ...current.options, ...patch } }))
  }

  const addImage = async (file: File, page = selectedPage) => {
    const src = await imageFileToDataUrl(file)
    if (!src) {
      notify("이미지를 읽지 못했어요.", "warn")
      return
    }
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
          x: 18,
          y: 20,
          width: 48,
          rotation: 0,
          opacity: 1,
          zIndex: Math.max(0, ...current.images.map((image) => image.zIndex)) + 1,
        },
      ],
    }))
    setSelectedPage(page)
    setSelectedImageId(id)
    setSelectedBubbleId("")
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
    patchMember(id, { avatar })
  }

  const deleteMemberAvatar = (id: string) => {
    patchMember(id, { avatar: "" })
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
      const count = current.speechBubbles.filter((bubble) => bubble.page === selectedPage).length
      return {
        ...current,
        speechBubbles: [
          ...current.speechBubbles,
          {
            id,
            page: selectedPage,
            profileId,
            speakerName: member.name,
            text,
            secondaryText,
            x: side === "left" ? 10 : 38,
            y: 18 + (count * 10) % 54,
            width: 52,
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
    setActiveTab("dialogue")
    notify("말풍선을 현재 페이지에 놓았어요.", "success")
  }

  const patchBubble = (id: string, patch: Partial<SpeechBubble>, transient = false) => {
    const update = (current: BookDocument) => ({
      ...current,
      speechBubbles: current.speechBubbles.map((bubble) => {
        if (bubble.id !== id) return bubble
        const member = patch.profileId ? current.members.find((item) => item.id === patch.profileId) : null
        return {
          ...bubble,
          ...patch,
          ...(member ? { speakerName: member.name, bubbleColor: member.bubbleColor, textColor: member.textColor } : {}),
        }
      }),
    })
    if (transient) updateTransient(update)
    else commit(update)
  }

  const deleteBubble = (id = selectedBubbleId) => {
    if (!id) return
    commit((current) => ({ ...current, speechBubbles: current.speechBubbles.filter((bubble) => bubble.id !== id) }))
    setSelectedBubbleId("")
    notify("말풍선을 지웠어요.")
  }

  const addMark = (start: number, end: number, kind: MarkKind, value: string) => {
    if (start === end) {
      notify("본문에서 꾸밀 글자를 먼저 드래그해 주세요.", "warn")
      return
    }
    commit((current) => ({
      ...current,
      marks: [...current.marks, { id: crypto.randomUUID(), start: Math.min(start, end), end: Math.max(start, end), kind, value }],
    }))
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

  const saveTemporary = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documentState))
      setHasSavedDraft(true)
      setSaveStatus("saved")
      notify("브라우저에 폭신하게 담아뒀어요.", "success")
    } catch {
      notify("브라우저 저장 공간이 부족해요. 작업 파일로 보관해 주세요.", "warn")
    }
  }

  const importProject = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as BookDocument
      if (parsed.version !== 1 || typeof parsed.body !== "string" || !parsed.options) throw new Error("invalid")
      commit(() => ({
        ...createDocument(),
        ...parsed,
        options: { ...DEFAULT_OPTIONS, ...parsed.options },
        images: Array.isArray(parsed.images) ? parsed.images : [],
        members: Array.isArray(parsed.members) ? parsed.members : [],
        speechBubbles: Array.isArray(parsed.speechBubbles) ? parsed.speechBubbles : [],
        marks: Array.isArray(parsed.marks) ? parsed.marks : [],
        footers: parsed.footers ?? {},
      }))
      setSelectedImageId("")
      setSelectedBubbleId("")
      setSelectedPage(parsed.options.coverMode === "none" ? 1 : 0)
      setHasSavedDraft(true)
      setScreen("editor")
      notify("작업 파일을 불러왔어요.", "success")
    } catch {
      notify("이 앱에서 만든 작업 파일인지 확인해 주세요.", "warn")
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

  const selectTool = (tab: EditorTab) => {
    setActiveTab(tab)
    setMobilePanelOpen((open) => tab === activeTab ? !open : true)
  }

  const selectPage = (page: number) => {
    setSelectedPage(page)
    const selectedBelongsElsewhere = selectedImage && selectedImage.page !== page
    if (selectedBelongsElsewhere) setSelectedImageId("")
    const bubbleBelongsElsewhere = selectedBubble && selectedBubble.page !== page
    if (bubbleBelongsElsewhere) setSelectedBubbleId("")
  }

  const pageCount = pages.length + (documentState.options.coverMode === "none" ? 0 : 1)
  const mascotMessage = toast?.message ?? (saveStatus === "saving" ? "문장을 포개는 중…" : saveStatus === "error" ? "작업 파일로 보관해 주세요" : "굴 안에 잘 담아뒀어요")

  const createNewBook = () => {
    const next = createDocument()
    next.title = "제목 없는 책"
    next.body = ""
    next.options = { ...next.options, coverTitle: "제목 없는 책", coverSubtitle: "" }
    past.current = []
    future.current = []
    setDocumentState(next)
    setSelectedPage(0)
    setSelectedImageId("")
    setSelectedBubbleId("")
    setActiveTab("manuscript")
    setScreen("editor")
    notify("새 이불을 폈어요. 첫 문장을 적어볼까요?", "success")
    refreshHistory()
  }

  const continueDraft = () => {
    if (!hasSavedDraft) return
    const saved = loadDocument()
    setDocumentState(saved)
    setSelectedPage(saved.options.coverMode === "none" ? 1 : 0)
    setSelectedImageId("")
    setSelectedBubbleId("")
    setScreen("editor")
    notify("이어서 폭신하게 써 볼까요?", "success")
  }

  const returnHome = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documentState))
      setHasSavedDraft(true)
    } catch {
      setSaveStatus("error")
    }
    setMobilePanelOpen(false)
    setScreen("home")
  }

  if (screen === "home") {
    return (
      <HomeScreen
        hasDraft={hasSavedDraft}
        onNew={createNewBook}
        onContinue={continueDraft}
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
        members={documentState.members}
        customPresets={customPresets}
        onClose={() => setMobilePanelOpen(false)}
        onSetTitle={(title) => commit((current) => ({ ...current, title }))}
        onSetBody={(body) => commit((current) => ({ ...current, body }))}
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
        onDeleteBubble={() => deleteBubble()}
        onPatchFooter={patchFooter}
        onApplyFooterAll={applyFooterAll}
        onDeleteFooter={deleteFooter}
        onExport={runExport}
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
          <div className="document-heading">
            <strong>{documentState.title || "제목 없는 책"}</strong>
          </div>
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
            selectedImageId={selectedImageId}
            selectedBubbleId={selectedBubbleId}
            transformMode={transformMode}
            onSelectPage={selectPage}
            onSelectImage={(id) => {
              setSelectedImageId(id)
              setSelectedBubbleId("")
              setActiveTab("image")
            }}
            onSelectBubble={(id) => {
              setSelectedBubbleId(id)
              setSelectedImageId("")
              setActiveTab("dialogue")
            }}
            onAddImage={addImage}
            onChangeImage={(id, patch) => patchImage(id, patch, true)}
            onDeleteImage={deleteImage}
            onChangeBubble={(id, patch) => patchBubble(id, patch, true)}
            onDeleteBubble={deleteBubble}
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
