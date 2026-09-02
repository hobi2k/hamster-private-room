import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Bold,
  Camera,
  Check,
  ChevronDown,
  ClipboardCopy,
  Download,
  FileDown,
  FileUp,
  Film,
  Highlighter,
  ImagePlus,
  Italic,
  MessageCircleMore,
  Palette,
  Pin,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  UserPlus,
  UserRound,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, CSSProperties, PointerEvent, ReactNode } from "react"
import { DEFAULT_OPTIONS, THEMES } from "../data/themes"
import { avatarFrame, avatarStyle, clampAvatarCenter } from "../lib/avatar"
import {
  COLOR_MEMORY_EVENT,
  EMPTY_COLOR_MEMORY,
  readColorMemory,
  RECOMMENDED_COLORS,
  rememberColor,
  togglePinnedColor,
  writeColorMemory,
} from "../lib/colorMemory"
import { resolveFlowTextSelection } from "../lib/domText"
import { fitImageToPage } from "../lib/image"
import { sanitizeHtml } from "../lib/html"
import { pageHeightForPreset } from "../lib/page"
import { STICKER_MAX_SIZE, STICKER_MIN_SIZE, isAnimatedSticker } from "../lib/sticker"
import type {
  BookDocument,
  BookOptions,
  DividerBlock,
  DividerStyle,
  EditorTab,
  ExportMode,
  FooterNote,
  HtmlCardBlock,
  ImageLayer,
  InlineImageBlock,
  MarkKind,
  MemberProfile,
  PageAppearance,
  PageMeta,
  SpeechBubble,
  StickerKind,
  StickerLayer,
  TextSelection,
  ThemePreset,
} from "../types"

const FONT_OPTIONS = ["RIDIBatang", "Chosunilbo_myungjo", "Noto Serif KR", "Pretendard", "Nanum Myeongjo"]

type Props = {
  document: BookDocument
  activeTab: EditorTab
  selectedPage: number
  selectedImage: ImageLayer | null
  selectedBubble: SpeechBubble | null
  selectedDivider: DividerBlock | null
  selectedInlineImage: InlineImageBlock | null
  selectedHtmlCard: HtmlCardBlock | null
  selectedSticker: StickerLayer | null
  currentPageAppearance: PageAppearance
  currentPageMeta: PageMeta
  textSelection: TextSelection | null
  members: MemberProfile[]
  customPresets: ThemePreset[]
  onClose: () => void
  onSetTitle: (title: string, transient?: boolean) => void
  onPatchOptions: (patch: Partial<BookOptions>, transient?: boolean) => void
  onApplyTheme: (theme: ThemePreset) => void
  onSavePreset: (name: string) => void
  onOverwritePreset: (id: string, name: string) => void
  onDeletePreset: (id: string) => void
  onAddMark: (start: number, end: number, kind: MarkKind, value: string) => void
  onSetMark: (start: number, end: number, kind: MarkKind, value: string, transient?: boolean) => void
  onSetAlign: (value: string, selection: TextSelection | null) => void
  onClearMarks: (selection: TextSelection | null) => void
  onUploadCover: (file: File) => void
  onAddImage: (file: File) => void
  onPatchImage: (patch: Partial<ImageLayer>) => void
  onDeleteImage: () => void
  onAddInlineImage: (file: File) => void
  onPatchInlineImage: (patch: Partial<InlineImageBlock>, transient?: boolean) => void
  onDeleteInlineImage: () => void
  onAddHtmlCard: (html: string) => void
  onPatchHtmlCard: (patch: Partial<HtmlCardBlock>, transient?: boolean) => void
  onDeleteHtmlCard: () => void
  onAddSticker: (kind: StickerKind, assetId?: string) => void
  onUploadStickerAsset: (file: File) => void
  onDeleteStickerAsset: (id: string) => void
  onPatchSticker: (patch: Partial<StickerLayer>, transient?: boolean) => void
  onDeleteSticker: () => void
  onAddMember: () => string
  onPatchMember: (id: string, patch: Partial<MemberProfile>, transient?: boolean) => void
  onSetMemberAvatar: (id: string, file: File) => void
  onSetMemberAvatarUrl: (id: string, url: string) => void
  onDeleteMemberAvatar: (id: string) => void
  onDeleteMember: (id: string) => void
  onAddBubble: (profileId: string, text: string, secondaryText: string, side: SpeechBubble["side"]) => void
  onPatchBubble: (patch: Partial<SpeechBubble>) => void
  onMoveBubble: (direction: -1 | 1) => void
  onInsertTextBeforeBubble: () => void
  onInsertTextAfterBubble: () => void
  onDeleteBubble: () => void
  onAddDivider: (style: DividerStyle, color: string) => void
  onPatchDivider: (patch: Partial<DividerBlock>) => void
  onDeleteDivider: () => void
  onPatchFooter: (patch: Partial<FooterNote>) => void
  onApplyFooterAll: () => void
  onDeleteFooter: (all: boolean) => void
  onPatchPageAppearance: (patch: Partial<PageAppearance>, scope: "selected" | "all") => void
  onPatchPageMeta: (patch: Partial<PageMeta>, scope: "selected" | "all") => void
  onFitPageHeight: () => void
  onExport: (mode: ExportMode) => void
  onExportGif: () => void
  onCopyPage: () => void
  onSelectAllPages: () => void
  onSelectCurrentPage: () => void
  onSaveTemporary: () => void
  onDownloadProject: () => void
  onImportProject: (file: File) => void
  onNotify: (message: string) => void
  onInputSessionStart: () => void
  onInputSessionEnd: () => void
}

function PanelHeader({ title, onReset }: { title: string; onReset?: () => void }) {
  const hint = title.startsWith("원고") ? "문장 포개기"
    : title.startsWith("책 정보") ? "표지와 발도장"
    : title.startsWith("전체 테마") ? "이불 고르기"
      : title.startsWith("이미지") ? "사진 붙이기"
        : title.startsWith("말풍선") ? "수다 떨기"
          : title.startsWith("스티커") ? "다이어리 꾸미기"
          : title.startsWith("지면") ? "폭신하게"
            : title.startsWith("페이지 꼬리말") ? "발도장 남기기"
              : "굴 밖으로"
  return (
    <header className="panel-header">
      <div>
        <h2>{title}</h2>
        <span className="panel-header-hint">{hint}</span>
      </div>
      {onReset ? (
        <button className="icon-button" type="button" onClick={onReset} title="이 설정 초기화">
          <RotateCcw aria-hidden="true" />
        </button>
      ) : null}
    </header>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

function RangeField({
  label,
  min,
  max,
  step = 1,
  value,
  suffix = "",
  onChange,
}: {
  label: string
  min: number
  max: number
  step?: number
  value: number
  suffix?: string
  onChange: (value: number) => void
}) {
  // Keep the thumb/readout responsive with local state during a drag, but only
  // commit (one history entry) when the interaction ends — otherwise every
  // pointer tick pushes an undo step and floods history.
  const [live, setLive] = useState(value)
  const dragging = useRef(false)
  useEffect(() => {
    if (!dragging.current) setLive(value)
  }, [value])
  const display = live
  return (
    <label className="range-field">
      <span>
        {label}
        <output>{Number.isInteger(display) ? display : display.toFixed(2)}{suffix}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={display}
        onChange={(event) => {
          dragging.current = true
          setLive(Number(event.target.value))
        }}
        onPointerUp={(event) => {
          dragging.current = false
          onChange(Number(event.currentTarget.value))
        }}
        onKeyUp={(event) => {
          dragging.current = false
          onChange(Number(event.currentTarget.value))
        }}
        onBlur={(event) => {
          if (!dragging.current) return
          dragging.current = false
          onChange(Number(event.currentTarget.value))
        }}
      />
    </label>
  )
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const [memory, setMemory] = useState(EMPTY_COLOR_MEMORY)

  useEffect(() => {
    const sync = () => setMemory(readColorMemory())
    sync()
    window.addEventListener(COLOR_MEMORY_EVENT, sync)
    return () => window.removeEventListener(COLOR_MEMORY_EVENT, sync)
  }, [])

  const saveMemory = (next: typeof memory) => {
    setMemory(writeColorMemory(next))
    window.dispatchEvent(new Event(COLOR_MEMORY_EVENT))
  }
  const choose = (color: string) => {
    onChange(color)
    saveMemory(rememberColor(memory, color))
  }
  const pinned = memory.pinned.includes(value.toLowerCase())

  return (
    <div className={`color-control${open ? " is-open" : ""}`}>
      <label className="color-input" title={label}>
        <input
          type="color"
          value={value}
          // Only commit on change (picker close); binding onInput too fired a
          // duplicate history entry for every event.
          onChange={(event) => choose(event.currentTarget.value)}
        />
        <span style={{ background: value }} />
        <small>{label}</small>
      </label>
      <button
        className="color-memory-toggle"
        type="button"
        aria-expanded={open}
        title={`${label} 색 보관함`}
        onClick={() => setOpen((current) => !current)}
      >
        <Palette aria-hidden="true" />
      </button>
      {open ? (
        <div className="color-memory-popover">
          <header>
            <span><strong>색 보관함</strong><small>최근 색은 자동 저장돼요</small></span>
            <button
              className={pinned ? "is-pinned" : ""}
              type="button"
              onClick={() => saveMemory(togglePinnedColor(memory, value))}
              title={pinned ? "현재 색 고정 해제" : "현재 색 고정"}
            >
              <Pin aria-hidden="true" /> {pinned ? "고정됨" : "현재 색 고정"}
            </button>
          </header>
          {memory.pinned.length ? (
            <div className="color-memory-group">
              <small>고정</small>
              <div className="color-swatch-row">
                {memory.pinned.map((color) => (
                  <button key={color} type="button" className={color === value.toLowerCase() ? "is-current" : ""} style={{ background: color }} onClick={() => choose(color)} title={`고정 색 ${color}`} />
                ))}
              </div>
            </div>
          ) : null}
          <div className="color-memory-group">
            <small>추천</small>
            <div className="color-swatch-row">
              {RECOMMENDED_COLORS.map((color) => (
                <button key={color} type="button" style={{ background: color }} onClick={() => choose(color)} title={`추천 색 ${color}`} />
              ))}
            </div>
          </div>
          {memory.recent.length ? (
            <div className="color-memory-group">
              <small>최근</small>
              <div className="color-swatch-row">
                {memory.recent.map((color) => (
                  <button key={color} type="button" style={{ background: color }} onClick={() => choose(color)} title={`최근 색 ${color}`} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function highlightValue(color: string, opacity: number) {
  return `${color}${Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, "0")}`
}

function AvatarCropper({ member, onChange }: { member: MemberProfile; onChange: (patch: Partial<MemberProfile>) => void }) {
  const [position, setPosition] = useState({ x: member.avatarX ?? 50, y: member.avatarY ?? 50 })
  const drag = useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
    rect: { width: number; height: number }
    position: { x: number; y: number }
  } | null>(null)

  useEffect(() => {
    if (drag.current) return
    setPosition({ x: member.avatarX ?? 50, y: member.avatarY ?? 50 })
  }, [member.avatarX, member.avatarY])

  const start = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      // Use the padding box (clientWidth/Height) — the image's left/top % resolve
      // against it, so a border-box rect would make the avatar pan too slowly.
      rect: { width: event.currentTarget.clientWidth, height: event.currentTarget.clientHeight },
      position,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current) return
    const frame = avatarFrame(member)
    const next = {
      x: clampAvatarCenter(current.originX + ((event.clientX - current.startX) / current.rect.width) * 100, frame.width),
      y: clampAvatarCenter(current.originY + ((event.clientY - current.startY) / current.rect.height) * 100, frame.height),
    }
    current.position = next
    setPosition(next)
  }

  const end = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    onChange({ avatarX: current.position.x, avatarY: current.position.y })
  }

  const scale = member.avatarScale ?? 100
  return (
    <div className="avatar-crop-controls">
      <div
        className="avatar-cropper"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <img
          src={member.avatar}
          alt="프로필 사진 자르기 미리보기"
          draggable={false}
          style={{ ...avatarStyle(member), left: `${position.x}%`, top: `${position.y}%` }}
          onLoad={(event) => {
            if (member.avatarAspectRatio) return
            const { naturalWidth, naturalHeight } = event.currentTarget
            onChange({
              avatarAspectRatio: (naturalWidth || naturalHeight || 1) / Math.max(1, naturalHeight),
              avatarX: 50,
              avatarY: 50,
            })
          }}
        />
        <span className="avatar-crop-guide" aria-hidden="true" />
      </div>
      <RangeField
        label="사진 확대"
        min={100}
        max={300}
        value={scale}
        suffix="%"
        onChange={(avatarScale) => {
          const frame = avatarFrame({ avatarAspectRatio: member.avatarAspectRatio, avatarScale })
          const avatarX = clampAvatarCenter(position.x, frame.width)
          const avatarY = clampAvatarCenter(position.y, frame.height)
          setPosition({ x: avatarX, y: avatarY })
          onChange({ avatarScale, avatarX, avatarY })
        }}
      />
      <button className="secondary-button" type="button" onClick={() => onChange({ avatarScale: 100, avatarX: 50, avatarY: 50 })}>
        <RotateCcw aria-hidden="true" /> 위치 초기화
      </button>
    </div>
  )
}

function Section({ title, children, open = true, className = "" }: { title: string; children: ReactNode; open?: boolean; className?: string }) {
  return (
    <details className={`inspector-section${className ? ` ${className}` : ""}`} open={open}>
      <summary>
        <span>{title}</span>
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="section-content">{children}</div>
    </details>
  )
}

function ManuscriptPanel(props: Props) {
  const options = props.document.options
  const [dividerStyle, setDividerStyle] = useState<DividerStyle>("diamond")
  const [dividerColor, setDividerColor] = useState(options.quoteColor)
  const [highlightOpen, setHighlightOpen] = useState(false)
  const [highlightSelection, setHighlightSelection] = useState<TextSelection | null>(null)
  const toolbarSelectionRef = useRef<TextSelection | null | undefined>(undefined)
  const captureToolbarSelection = () => {
    toolbarSelectionRef.current = resolveFlowTextSelection(props.document.body, props.textSelection)
  }
  const takeToolbarSelection = () => {
    const selection = toolbarSelectionRef.current === undefined ? props.textSelection : toolbarSelectionRef.current
    toolbarSelectionRef.current = undefined
    return selection
  }
  const addSelectionMark = (kind: MarkKind, value: string) => {
    const selection = takeToolbarSelection()
    if (!selection) {
      props.onNotify("페이지 본문에서 꾸밀 글자를 먼저 선택해 주세요.")
      return
    }
    props.onAddMark(selection.start, selection.end, kind, value)
  }

  const hasSelectionMark = (kind: MarkKind, value: string) => {
    const selection = props.textSelection
    if (!selection) return false
    return props.document.marks.some((mark) => mark.start === selection.start && mark.end === selection.end && mark.kind === kind && mark.value === value)
  }

  const selection = props.textSelection
  const hasRange = Boolean(selection && selection.start !== selection.end)
  const selectionFont = hasRange
    ? props.document.marks.find((mark) => mark.kind === "font" && mark.start <= selection!.start && mark.end >= selection!.end)?.value ?? ""
    : ""
  // Opening the native <select> blurs the editor, which can collapse the stored
  // selection before onChange fires — snapshot it on pointer down so the font
  // still lands on the range the user had highlighted.
  const fontSelectionRef = useRef<TextSelection | null>(null)
  const currentAlign = hasRange
    ? props.document.marks.find((mark) => mark.kind === "align" && mark.start <= selection!.start && mark.end >= selection!.end)?.value ?? options.defaultTextAlign
    : options.defaultTextAlign

  return (
    <>
      <PanelHeader title="원고 편집" />
      <div className="panel-scroll">
        <Section title="선택 글자 꾸미기">
          <div
            className="selection-toolbar"
            aria-label="선택한 글자 꾸미기"
            data-preserve-page-selection
            onPointerDown={(event) => {
              captureToolbarSelection()
              event.preventDefault()
            }}
          >
            <button className={hasSelectionMark("bold", "700") ? "is-active" : ""} type="button" onClick={() => addSelectionMark("bold", "700")} title="굵게">
              <Bold aria-hidden="true" />
            </button>
            <button className={hasSelectionMark("italic", "italic") ? "is-active" : ""} type="button" onClick={() => addSelectionMark("italic", "italic")} title="기울임">
              <Italic aria-hidden="true" />
            </button>
            <button className={hasSelectionMark("underline", "underline") ? "is-active" : ""} type="button" onClick={() => addSelectionMark("underline", "underline")} title="밑줄">
              <Underline aria-hidden="true" />
            </button>
            <button className={hasSelectionMark("strike", "line-through") ? "is-active" : ""} type="button" onClick={() => addSelectionMark("strike", "line-through")} title="취소선">
              <Strikethrough aria-hidden="true" />
            </button>
            {options.accentColors.map((color, index) => (
              <button
                className={`swatch-button${hasSelectionMark("color", color) ? " is-active" : ""}`}
                style={{ "--swatch": color } as React.CSSProperties}
                type="button"
                key={`${color}-${index}`}
                onClick={() => addSelectionMark("color", color)}
                title={`보조색 ${index + 1}`}
              />
            ))}
            <button
              className={`highlight-button${hasRange && props.document.marks.some((mark) => mark.kind === "highlight" && mark.start < selection!.end && mark.end > selection!.start) ? " is-active" : ""}`}
              style={{ "--highlight": options.highlightColor } as CSSProperties}
              type="button"
              onClick={() => {
                const target = takeToolbarSelection()
                if (!target || target.start === target.end) {
                  props.onNotify("페이지 본문에서 형광펜을 칠할 글자를 먼저 선택해 주세요.")
                  return
                }
                setHighlightSelection(target)
                setHighlightOpen(true)
                props.onSetMark(target.start, target.end, "highlight", highlightValue(options.highlightColor, options.highlightOpacity))
              }}
              title="형광펜"
            >
              <Highlighter aria-hidden="true" />
            </button>
            <button type="button" onClick={() => props.onClearMarks(takeToolbarSelection())} title="선택한 글자 효과 지우기">
              <RotateCcw aria-hidden="true" />
            </button>
          </div>
          {highlightOpen && highlightSelection ? (
            <div className="highlight-popover" data-preserve-page-selection>
              <div className="highlight-popover-head">
                <strong>형광펜</strong>
                <button className="icon-button" type="button" onClick={() => setHighlightOpen(false)} title="닫기"><X aria-hidden="true" /></button>
              </div>
              <label className="highlight-live-color">
                <span style={{ background: options.highlightColor }} />
                <input
                  type="color"
                  value={options.highlightColor}
                  onFocus={props.onInputSessionStart}
                  onInput={(event) => {
                    const highlightColor = event.currentTarget.value
                    props.onPatchOptions({ highlightColor }, true)
                    props.onSetMark(highlightSelection.start, highlightSelection.end, "highlight", highlightValue(highlightColor, options.highlightOpacity), true)
                  }}
                  onBlur={props.onInputSessionEnd}
                />
                <small>{options.highlightColor}</small>
              </label>
              <label className="range-field">
                <span>불투명도 <output>{Math.round(options.highlightOpacity * 100)}%</output></span>
                <input
                  type="range"
                  min={0.12}
                  max={0.8}
                  step={0.02}
                  value={options.highlightOpacity}
                  onPointerDown={props.onInputSessionStart}
                  onInput={(event) => {
                    const highlightOpacity = Number(event.currentTarget.value)
                    props.onPatchOptions({ highlightOpacity }, true)
                    props.onSetMark(highlightSelection.start, highlightSelection.end, "highlight", highlightValue(options.highlightColor, highlightOpacity), true)
                  }}
                  onPointerUp={props.onInputSessionEnd}
                  onBlur={props.onInputSessionEnd}
                />
              </label>
              <span className="highlight-preview" style={{ "--preview-highlight": highlightValue(options.highlightColor, options.highlightOpacity) } as CSSProperties}>선택한 문장에 바로 보여요</span>
            </div>
          ) : null}
          <div
            className="selection-toolbar"
            aria-label="문단 정렬"
            data-preserve-page-selection
            onPointerDown={(event) => {
              captureToolbarSelection()
              event.preventDefault()
            }}
          >
            <button className={currentAlign === "left" ? "is-active" : ""} type="button" onClick={() => props.onSetAlign("left", takeToolbarSelection())} title="왼쪽 정렬">
              <AlignLeft aria-hidden="true" />
            </button>
            <button className={currentAlign === "center" ? "is-active" : ""} type="button" onClick={() => props.onSetAlign("center", takeToolbarSelection())} title="가운데 정렬">
              <AlignCenter aria-hidden="true" />
            </button>
            <button className={currentAlign === "right" ? "is-active" : ""} type="button" onClick={() => props.onSetAlign("right", takeToolbarSelection())} title="오른쪽 정렬">
              <AlignRight aria-hidden="true" />
            </button>
            <button className={currentAlign === "justify" ? "is-active" : ""} type="button" onClick={() => props.onSetAlign("justify", takeToolbarSelection())} title="양쪽 정렬">
              <AlignJustify aria-hidden="true" />
            </button>
          </div>
          <Field label="선택 글자 글꼴">
            <select
              value={selectionFont}
              disabled={!hasRange}
              data-preserve-page-selection
              onPointerDown={() => {
                fontSelectionRef.current = resolveFlowTextSelection(props.document.body, props.textSelection)
              }}
              onChange={(event) => {
                const target = fontSelectionRef.current ?? props.textSelection
                // Reset so a later keyboard-driven change (no pointerdown) uses
                // the live selection instead of a stale captured range.
                fontSelectionRef.current = null
                if (!target || target.start === target.end) {
                  props.onNotify("페이지 본문에서 글꼴을 바꿀 글자를 먼저 선택해 주세요.")
                  return
                }
                props.onAddMark(target.start, target.end, "font", event.target.value)
              }}
            >
              <option value="">{hasRange ? "(기본 글꼴)" : "글자를 먼저 선택하세요"}</option>
              {FONT_OPTIONS.map((font) => <option value={font} key={font}>{font}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="보조색" open={false}>
          <div className="three-column-fields">
            {options.accentColors.map((color, index) => (
              <ColorInput
                key={`${color}-${index}`}
                label={`보조색 ${index + 1}`}
                value={color}
                onChange={(value) => {
                  const accentColors = [...options.accentColors] as [string, string, string]
                  accentColors[index] = value
                  props.onPatchOptions({ accentColors })
                }}
              />
            ))}
          </div>
        </Section>

        <Section title="구분선" open={false}>
          <div className="divider-style-grid" role="group" aria-label="구분선 모양">
            {(["solid", "dashed", "diamond", "dots", "asterism", "wave"] as DividerStyle[]).map((style) => (
              <button
                className={dividerStyle === style ? `divider-style-button style-${style} is-active` : `divider-style-button style-${style}`}
                type="button"
                key={style}
                onClick={() => setDividerStyle(style)}
                title={style === "solid" ? "실선" : style === "dashed" ? "점선" : style === "diamond" ? "다이아" : style === "asterism" ? "별 장식" : style === "wave" ? "물결" : "점 장식"}
                aria-label={style === "solid" ? "실선" : style === "dashed" ? "점선" : style === "diamond" ? "다이아" : style === "asterism" ? "별 장식" : style === "wave" ? "물결" : "점 장식"}
              >
                <span />
                {style === "diamond" ? <i>◆ ◆ ◆</i> : null}
                {style === "dots" ? <i>● ● ●</i> : null}
                {style === "asterism" ? <i>✦ ✦ ✦</i> : null}
                {style === "wave" ? <i>〜 〜 〜</i> : null}
              </button>
            ))}
          </div>
          <ColorInput label="구분선 색" value={dividerColor} onChange={setDividerColor} />
          <button className="primary-button" type="button" onClick={() => props.onAddDivider(dividerStyle, dividerColor)}>
            <Plus aria-hidden="true" /> 커서 위치에 추가
          </button>
          {props.selectedDivider ? (
            <div className="selected-divider-controls">
              <strong>선택한 구분선</strong>
              <Field label="모양">
                <select value={props.selectedDivider.style} onChange={(event) => props.onPatchDivider({ style: event.target.value as DividerStyle })}>
                  <option value="solid">실선</option>
                  <option value="dashed">점선</option>
                  <option value="diamond">다이아</option>
                  <option value="dots">점 장식</option>
                  <option value="asterism">별 장식</option>
                  <option value="wave">물결 장식</option>
                </select>
              </Field>
              <ColorInput label="색" value={props.selectedDivider.color} onChange={(color) => props.onPatchDivider({ color })} />
              <button className="danger-button" type="button" onClick={props.onDeleteDivider}>
                <Trash2 aria-hidden="true" /> 구분선 삭제
              </button>
            </div>
          ) : null}
        </Section>

        <Section title="스마트 하이라이트" open={false}>
          <label className="toggle-row">
            <input type="checkbox" checked={options.smartBold} onChange={(event) => props.onPatchOptions({ smartBold: event.target.checked })} />
            <span><b>**텍스트**</b> 자동 굵게</span>
          </label>
          <label className="toggle-row">
            <input type="checkbox" checked={options.smartAsterisk} onChange={(event) => props.onPatchOptions({ smartAsterisk: event.target.checked })} />
            <span><i>*텍스트*</i> 자동 강조</span>
          </label>
          <div className="two-column-fields">
            <ColorInput label="별표 강조" value={options.asteriskColor} onChange={(asteriskColor) => props.onPatchOptions({ asteriskColor })} />
            <label className="toggle-row"><input type="checkbox" checked={options.asteriskItalic} onChange={(event) => props.onPatchOptions({ asteriskItalic: event.target.checked })} /><span>기울임</span></label>
          </div>
          <label className="toggle-row">
            <input type="checkbox" checked={options.smartQuote} onChange={(event) => props.onPatchOptions({ smartQuote: event.target.checked })} />
            <span>따옴표 자동 서식</span>
          </label>
          <label className="toggle-row">
            <input type="checkbox" checked={options.smartBracket} onChange={(event) => props.onPatchOptions({ smartBracket: event.target.checked })} />
            <span>괄호 자동 서식</span>
          </label>
          <div className="two-column-fields">
            <ColorInput label={'"인용"'} value={options.quoteColor} onChange={(quoteColor) => props.onPatchOptions({ quoteColor })} />
            <ColorInput label="(괄호)" value={options.bracketColor} onChange={(bracketColor) => props.onPatchOptions({ bracketColor })} />
          </div>
          <label className="toggle-row">
            <input type="checkbox" checked={options.quoteItalic} onChange={(event) => props.onPatchOptions({ quoteItalic: event.target.checked })} />
            <span>따옴표 문구 기울이기</span>
          </label>
          <label className="toggle-row">
            <input type="checkbox" checked={options.bracketItalic} onChange={(event) => props.onPatchOptions({ bracketItalic: event.target.checked })} />
            <span>괄호 문구 기울이기</span>
          </label>
        </Section>

        <Section title="본문 이미지" open={Boolean(props.selectedInlineImage)}>
          <label className="file-button">
            <ImagePlus aria-hidden="true" />
            <span>커서 위치에 이미지 넣기</span>
            <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && props.onAddInlineImage(event.target.files[0])} />
          </label>
          {props.selectedInlineImage ? (
            <div className="inline-image-controls">
              <strong>{props.selectedInlineImage.name}</strong>
              <div className="selection-toolbar inline-align-toolbar" role="group" aria-label="본문 이미지 정렬">
                <button className={props.selectedInlineImage.align === "left" ? "is-active" : ""} type="button" onClick={() => props.onPatchInlineImage({ align: "left" })} title="왼쪽 정렬"><AlignLeft aria-hidden="true" /></button>
                <button className={props.selectedInlineImage.align === "center" ? "is-active" : ""} type="button" onClick={() => props.onPatchInlineImage({ align: "center" })} title="가운데 정렬"><AlignCenter aria-hidden="true" /></button>
                <button className={props.selectedInlineImage.align === "right" ? "is-active" : ""} type="button" onClick={() => props.onPatchInlineImage({ align: "right" })} title="오른쪽 정렬"><AlignRight aria-hidden="true" /></button>
              </div>
              <RangeField label="표시 너비" min={24} max={100} value={props.selectedInlineImage.width} suffix="%" onChange={(width) => props.onPatchInlineImage({ width })} />
              <RangeField label="틀 높이" min={80} max={700} value={props.selectedInlineImage.height ?? 260} suffix="px" onChange={(height) => props.onPatchInlineImage({ height })} />
              <RangeField label="투명도" min={0.1} max={1} step={0.05} value={props.selectedInlineImage.opacity ?? 1} onChange={(opacity) => props.onPatchInlineImage({ opacity })} />
              <RangeField label="사진 확대" min={100} max={400} value={props.selectedInlineImage.scale} suffix="%" onChange={(scale) => props.onPatchInlineImage({ scale })} />
              <RangeField label="가로 초점" min={0} max={100} value={props.selectedInlineImage.x} suffix="%" onChange={(x) => props.onPatchInlineImage({ x })} />
              <RangeField label="세로 초점" min={0} max={100} value={props.selectedInlineImage.y} suffix="%" onChange={(y) => props.onPatchInlineImage({ y })} />
              <button className="secondary-button" type="button" onClick={() => props.onPatchInlineImage({ scale: 100, x: 50, y: 50 })}><RotateCcw aria-hidden="true" /> 사진 위치 초기화</button>
              <button className="danger-button" type="button" onClick={props.onDeleteInlineImage}><Trash2 aria-hidden="true" /> 본문 이미지 삭제</button>
            </div>
          ) : null}
        </Section>
      </div>
    </>
  )
}

function ThemePanel(props: Props) {
  const [presetName, setPresetName] = useState("")
  const selectedCustom = props.customPresets.find((preset) => preset.id === props.document.options.themeId) ?? null
  useEffect(() => {
    setPresetName(selectedCustom?.name ?? "")
  }, [selectedCustom?.id, selectedCustom?.name])
  return (
    <>
      <PanelHeader
        title="전체 테마"
        onReset={() => props.onPatchOptions({
          ...DEFAULT_OPTIONS,
          // Theme reset restores visual defaults only — the user's cover content
          // (authored in the manuscript panel) must be preserved.
          coverMode: props.document.options.coverMode,
          coverTitle: props.document.options.coverTitle,
          coverTitleColor: props.document.options.coverTitleColor,
          coverSubtitle: props.document.options.coverSubtitle,
          coverSubtitleColor: props.document.options.coverSubtitleColor,
          coverImage: props.document.options.coverImage,
        })}
      />
      <div className="panel-scroll">
        <div className="theme-list">
          {[...THEMES, ...props.customPresets].map((theme) => (
            <div
              className={props.document.options.themeId === theme.id ? "theme-row is-active" : "theme-row"}
              key={theme.id}
            >
              <button className="theme-apply" type="button" onClick={() => props.onApplyTheme(theme)}>
                <span className="theme-colors">
                  {theme.colors.map((color) => <i key={color} style={{ background: color }} />)}
                </span>
                <span>
                  <strong>{theme.name}</strong>
                  <small>{theme.description}</small>
                </span>
              </button>
              {props.document.options.themeId === theme.id ? <Check className="theme-check" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
        <Section title={selectedCustom ? "선택한 사용자 테마 관리" : "현재 설정을 테마로 저장"}>
          <p className="section-note">기본 지면·폰트와 멤버 프로필, 아바타, 말풍선·글자·이름색을 저장합니다. 실제 대사와 위치는 책에만 남습니다.</p>
          <Field label="테마 이름">
            <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="예: 겨울 편지" />
          </Field>
          {selectedCustom ? (
            <>
              <div className="preset-member-summary">
                <UserRound aria-hidden="true" />
                <span><strong>{props.document.members.length}명</strong><small>현재 책의 말풍선 멤버가 함께 저장됩니다.</small></span>
              </div>
              <button className="primary-button" type="button" onClick={() => props.onOverwritePreset(selectedCustom.id, presetName)}>
                <Save aria-hidden="true" /> 현재 설정으로 덮어쓰기
              </button>
              <button className="secondary-button" type="button" onClick={() => props.onSavePreset(presetName)}>
                <Plus aria-hidden="true" /> 새 테마로 따로 저장
              </button>
              <button className="danger-button" type="button" onClick={() => props.onDeletePreset(selectedCustom.id)}>
                <Trash2 aria-hidden="true" /> 이 사용자 테마 삭제
              </button>
            </>
          ) : (
            <button className="primary-button" type="button" onClick={() => props.onSavePreset(presetName)}>
              <Save aria-hidden="true" /> 새 테마 저장
            </button>
          )}
        </Section>
      </div>
    </>
  )
}

function ImagePanel(props: Props) {
  const image = props.selectedImage
  const [backgroundScope, setBackgroundScope] = useState<"selected" | "all">("selected")
  const [imageFit, setImageFit] = useState<"cover" | "contain" | "fill">("cover")
  const [imagePosition, setImagePosition] = useState<"top" | "center" | "bottom">("center")
  const background = props.currentPageAppearance
  const applyImageFit = (fit = imageFit, position = imagePosition) => {
    if (!image) return
    const ratio = props.document.options.pageHeight / props.document.options.pageWidth
    if (fit === "fill") {
      props.onPatchImage({ x: 0, y: 0, width: 100, height: 100, rotation: 0, stretch: true })
      return
    }
    const aspect = Math.max(0.1, image.aspectRatio ?? 1)
    const fitted = fit === "cover"
      ? fitImageToPage(aspect, ratio)
      : (() => {
        const width = Math.min(100, aspect * ratio * 100)
        const height = width / (aspect * ratio)
        return { width, x: (100 - width) / 2, y: (100 - height) / 2, rotation: 0 }
      })()
    const height = fitted.width / (aspect * ratio)
    const y = position === "top" ? 0 : position === "bottom" ? 100 - height : (100 - height) / 2
    props.onPatchImage({ ...fitted, y, height: undefined, stretch: false })
  }
  return (
    <>
      <PanelHeader title={`이미지 레이어 · ${props.selectedPage}쪽`} />
      <div className="panel-scroll">
        <Section title="페이지 배경">
          <Field label="적용 대상">
            <select value={backgroundScope} onChange={(event) => setBackgroundScope(event.target.value as "selected" | "all")}>
              <option value="selected">선택한 페이지만</option>
              <option value="all">모든 페이지</option>
            </select>
          </Field>
          <Field label="배경 유형">
            <select value={background.backgroundType} onChange={(event) => props.onPatchPageAppearance({ backgroundType: event.target.value as PageAppearance["backgroundType"] }, backgroundScope)}>
              <option value="solid">단색</option>
              <option value="gradient">그라데이션</option>
            </select>
          </Field>
          {background.backgroundType === "solid" ? (
            <ColorInput label="배경색" value={background.backgroundColor} onChange={(backgroundColor) => props.onPatchPageAppearance({ backgroundColor }, backgroundScope)} />
          ) : (
            <>
              <div className="two-column-fields">
                <ColorInput label="시작색" value={background.gradientStart} onChange={(gradientStart) => props.onPatchPageAppearance({ gradientStart }, backgroundScope)} />
                <ColorInput label="끝색" value={background.gradientEnd} onChange={(gradientEnd) => props.onPatchPageAppearance({ gradientEnd }, backgroundScope)} />
              </div>
              <RangeField label="그라데이션 방향" min={0} max={360} value={background.gradientAngle} suffix="°" onChange={(gradientAngle) => props.onPatchPageAppearance({ gradientAngle }, backgroundScope)} />
            </>
          )}
        </Section>
        <label className="image-drop-zone">
          <ImagePlus aria-hidden="true" />
          <strong>이미지 추가</strong>
          <span>파일 선택 또는 페이지 위로 끌어놓기</span>
          <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && props.onAddImage(event.target.files[0])} />
        </label>
        {image ? (
          <Section title={image.name}>
            <p className="shortcut-note"><kbd>Ctrl</kbd> + <kbd>T</kbd>로 캔버스 변형 핸들을 켤 수 있습니다.</p>
            <button className="primary-button" type="button" onClick={() => applyImageFit("cover", imagePosition)}>
              <ImagePlus aria-hidden="true" /> 페이지 가득 채우기
            </button>
            <Field label="이미지 채우기 방식">
              <select value={imageFit} onChange={(event) => { const fit = event.target.value as typeof imageFit; setImageFit(fit); applyImageFit(fit, imagePosition) }}>
                <option value="cover">꽉 채우기</option>
                <option value="contain">원본 비율 맞추기</option>
                <option value="fill">강제로 늘리기</option>
              </select>
            </Field>
            <Field label="초기 세로 위치">
              <select value={imagePosition} onChange={(event) => { const position = event.target.value as typeof imagePosition; setImagePosition(position); applyImageFit(imageFit, position) }}>
                <option value="top">상단</option>
                <option value="center">중앙</option>
                <option value="bottom">하단</option>
              </select>
            </Field>
            <RangeField label="가로 위치" min={-500} max={100} value={image.x} suffix="%" onChange={(x) => props.onPatchImage({ x })} />
            <RangeField label="세로 위치" min={-500} max={100} value={image.y} suffix="%" onChange={(y) => props.onPatchImage({ y })} />
            <RangeField label="크기" min={8} max={500} value={image.width} suffix="%" onChange={(width) => props.onPatchImage({ width })} />
            <RangeField label="회전" min={-180} max={180} value={image.rotation} suffix="°" onChange={(rotation) => props.onPatchImage({ rotation })} />
            <RangeField label="투명도" min={0.05} max={1} step={0.05} value={image.opacity} onChange={(opacity) => props.onPatchImage({ opacity })} />
            <label className="toggle-row"><input type="checkbox" checked={image.grayscale ?? false} onChange={(event) => props.onPatchImage({ grayscale: event.target.checked })} /><span>흑백 모드</span></label>
            <RangeField label="다크 오버레이" min={0} max={0.9} step={0.05} value={image.overlay ?? 0} onChange={(overlay) => props.onPatchImage({ overlay })} />
            <button className="danger-button" type="button" onClick={props.onDeleteImage}>
              <Trash2 aria-hidden="true" /> 이미지 삭제
            </button>
          </Section>
        ) : (
          <div className="empty-panel">
            <Type aria-hidden="true" />
            <p>페이지의 이미지를 누르면 위치와 크기를 세밀하게 조절할 수 있어요.</p>
          </div>
        )}
      </div>
    </>
  )
}

function DialoguePanel(props: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [selectedMemberId, setSelectedMemberId] = useState(props.members[0]?.id ?? "")
  const [message, setMessage] = useState("")
  const [secondaryText, setSecondaryText] = useState("")
  const [side, setSide] = useState<SpeechBubble["side"]>("left")
  const [avatarUrl, setAvatarUrl] = useState("")
  const selectedMember = props.members.find((member) => member.id === selectedMemberId) ?? null

  useEffect(() => {
    if (selectedMember || !props.members.length) return
    setSelectedMemberId(props.members[0].id)
  }, [props.members, selectedMember])

  useEffect(() => {
    const profileId = props.selectedBubble?.profileId
    if (profileId && props.members.some((member) => member.id === profileId)) setSelectedMemberId(profileId)
    if (props.selectedBubble) panelRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [props.members, props.selectedBubble])

  const addMember = () => {
    setSelectedMemberId(props.onAddMember())
  }

  const addBubble = () => {
    if (!selectedMember || !message.trim()) {
      props.onNotify("멤버와 대사를 입력해 주세요.")
      return
    }
    props.onAddBubble(selectedMember.id, message.trim(), secondaryText.trim(), side)
    setMessage("")
    setSecondaryText("")
  }

  return (
    <>
      <PanelHeader title={`말풍선 · ${props.selectedPage}쪽`} />
      <div className="panel-scroll dialogue-panel" ref={panelRef}>
        <Section title="멤버 프로필">
          <div className="profile-list">
            {props.members.map((member) => (
              <button
                className={member.id === selectedMemberId ? "profile-row is-active" : "profile-row"}
                type="button"
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
              >
                <span className="profile-avatar">
                  {member.avatar ? <img src={member.avatar} alt="" style={avatarStyle(member)} /> : <UserRound aria-hidden="true" />}
                </span>
                <strong>{member.name}</strong>
                <i style={{ background: member.bubbleColor }} />
              </button>
            ))}
          </div>
          <button className="secondary-button" type="button" onClick={addMember}>
            <UserPlus aria-hidden="true" /> 멤버 추가
          </button>
        </Section>

        {selectedMember ? (
          <Section title="선택한 멤버" open={false}>
            <Field label="이름">
              <input
                value={selectedMember.name}
                onFocus={props.onInputSessionStart}
                onChange={(event) => props.onPatchMember(selectedMember.id, { name: event.target.value }, true)}
                onBlur={props.onInputSessionEnd}
              />
            </Field>
            <div className="two-column-fields">
              <ColorInput label="말풍선" value={selectedMember.bubbleColor} onChange={(bubbleColor) => props.onPatchMember(selectedMember.id, { bubbleColor })} />
              <ColorInput label="글자" value={selectedMember.textColor} onChange={(textColor) => props.onPatchMember(selectedMember.id, { textColor })} />
            </div>
            <div className="two-column-fields">
              <ColorInput label="이름색" value={selectedMember.nameColor ?? selectedMember.textColor} onChange={(nameColor) => props.onPatchMember(selectedMember.id, { nameColor })} />
              <ColorInput label="이름 테두리" value={selectedMember.nameOutlineColor ?? "#ffffff"} onChange={(nameOutlineColor) => props.onPatchMember(selectedMember.id, { nameOutlineColor })} />
            </div>
            <label className="toggle-row"><input type="checkbox" checked={selectedMember.nameOutline ?? false} onChange={(event) => props.onPatchMember(selectedMember.id, { nameOutline: event.target.checked })} /><span>이름 외곽선</span></label>
            <label className="toggle-row"><input type="checkbox" checked={selectedMember.hideName ?? false} onChange={(event) => props.onPatchMember(selectedMember.id, { hideName: event.target.checked })} /><span>이름 숨기기</span></label>
            <label className="file-button">
              <Camera aria-hidden="true" />
              <span>{selectedMember.avatar ? "프로필 사진 바꾸기" : "프로필 사진 추가"}</span>
              <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && props.onSetMemberAvatar(selectedMember.id, event.target.files[0])} />
            </label>
            <Field label="이미지 URL">
              <div className="field-action-row">
                <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." />
                <button type="button" className="secondary-button" onClick={() => props.onSetMemberAvatarUrl(selectedMember.id, avatarUrl)}>불러오기</button>
              </div>
            </Field>
            {selectedMember.avatar ? (
              <>
                <AvatarCropper member={selectedMember} onChange={(patch) => props.onPatchMember(selectedMember.id, patch)} />
                <button className="secondary-button" type="button" onClick={() => props.onDeleteMemberAvatar(selectedMember.id)}>
                  <Trash2 aria-hidden="true" /> 사진만 삭제
                </button>
              </>
            ) : (
              <>
                <div className="two-column-fields">
                  <ColorInput label="프로필 배경" value={selectedMember.backgroundColor ?? "#ffffff"} onChange={(backgroundColor) => props.onPatchMember(selectedMember.id, { backgroundColor })} />
                  <ColorInput label="이니셜 색" value={selectedMember.labelColor ?? "#777777"} onChange={(labelColor) => props.onPatchMember(selectedMember.id, { labelColor })} />
                </div>
                <Field label="프로필 글자"><input maxLength={4} value={selectedMember.label ?? ""} onChange={(event) => props.onPatchMember(selectedMember.id, { label: event.target.value })} /></Field>
              </>
            )}
            <button className="danger-button" type="button" onClick={() => props.onDeleteMember(selectedMember.id)}>
              <Trash2 aria-hidden="true" /> 멤버 삭제
            </button>
          </Section>
        ) : null}

        <Section title="새 말풍선">
          {props.members.length ? (
            <Field label="멤버">
              <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
                {props.members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}
              </select>
            </Field>
          ) : (
            <div className="empty-inline"><UserRound aria-hidden="true" /><span>먼저 멤버를 추가해 주세요.</span></div>
          )}
          <Field label="대사">
            <textarea className="compact-textarea" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="말풍선에 넣을 문장" />
          </Field>
          <Field label="작은 보조 문장">
            <input value={secondaryText} onChange={(event) => setSecondaryText(event.target.value)} placeholder="선택 사항" />
          </Field>
          <Field label="프로필 위치">
            <select value={side} onChange={(event) => setSide(event.target.value as SpeechBubble["side"])}>
              <option value="left">왼쪽</option>
              <option value="right">오른쪽</option>
            </select>
          </Field>
          <button className="primary-button" type="button" onClick={addBubble} disabled={!props.members.length}>
            <MessageCircleMore aria-hidden="true" /> 현재 페이지에 추가
          </button>
        </Section>

        {props.selectedBubble ? (
          <Section title="선택한 말풍선" className="selected-bubble-section">
            <Field label="멤버">
              <select value={props.selectedBubble.profileId} onChange={(event) => props.onPatchBubble({ profileId: event.target.value })}>
                <option value="">프로필 없이 표시</option>
                {props.members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}
              </select>
            </Field>
            <Field label="대사">
              <textarea className="compact-textarea" value={props.selectedBubble.text} onChange={(event) => props.onPatchBubble({ text: event.target.value })} />
            </Field>
            <Field label="작은 보조 문장">
              <input value={props.selectedBubble.secondaryText} onChange={(event) => props.onPatchBubble({ secondaryText: event.target.value })} />
            </Field>
            <div className="bubble-move-buttons" role="group" aria-label="말풍선 세로 순서">
              <button className="secondary-button" type="button" onClick={() => props.onMoveBubble(-1)}>
                <ArrowUp aria-hidden="true" /> 위로
              </button>
              <button className="secondary-button" type="button" onClick={() => props.onMoveBubble(1)}>
                <ArrowDown aria-hidden="true" /> 아래로
              </button>
            </div>
            {props.selectedBubble.page > 0 ? (
              <div className="bubble-move-buttons">
                <button className="secondary-button" type="button" onClick={props.onInsertTextBeforeBubble} title="이 말풍선 앞에 본문 글을 써 넣어요">
                  <Type aria-hidden="true" /> 앞에 글
                </button>
                <button className="secondary-button" type="button" onClick={props.onInsertTextAfterBubble} title="이 말풍선 뒤에 본문 글을 써 넣어요">
                  <Type aria-hidden="true" /> 뒤에 글
                </button>
              </div>
            ) : null}
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={props.selectedBubble.autoWidth !== false}
                onChange={(event) => props.onPatchBubble({ autoWidth: event.target.checked })}
              />
              <span>가장 긴 줄에 맞춰 너비 자동 조정</span>
            </label>
            {props.selectedBubble.autoWidth === false ? (
              <RangeField label="말풍선 너비" min={24} max={88} value={props.selectedBubble.width} suffix="%" onChange={(width) => props.onPatchBubble({ width })} />
            ) : null}
            <RangeField
              label="대사 글자 크기"
              min={60}
              max={180}
              step={5}
              value={props.selectedBubble.textScale ?? 100}
              suffix="%"
              onChange={(textScale) => props.onPatchBubble({ textScale })}
            />
            <RangeField
              label="보조문장 글자 크기"
              min={60}
              max={180}
              step={5}
              value={props.selectedBubble.secondaryTextScale ?? 100}
              suffix="%"
              onChange={(secondaryTextScale) => props.onPatchBubble({ secondaryTextScale })}
            />
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={props.selectedBubble.showName !== false}
                onChange={(event) => props.onPatchBubble({ showName: event.target.checked })}
              />
              <span>이름 표시</span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={props.selectedBubble.continuation ?? false}
                onChange={(event) => props.onPatchBubble({ continuation: event.target.checked })}
              />
              <span>이어 말풍선 (프로필·꼬리 숨김)</span>
            </label>
            <div className="two-column-fields">
              <ColorInput label="말풍선" value={props.selectedBubble.bubbleColor} onChange={(bubbleColor) => props.onPatchBubble({ bubbleColor })} />
              <ColorInput label="대사" value={props.selectedBubble.textColor} onChange={(textColor) => props.onPatchBubble({ textColor })} />
              <ColorInput label="이름" value={props.selectedBubble.nameColor ?? props.selectedBubble.textColor} onChange={(nameColor) => props.onPatchBubble({ nameColor })} />
              <ColorInput label="이름 테두리" value={props.selectedBubble.nameOutlineColor ?? "#ffffff"} onChange={(nameOutlineColor) => props.onPatchBubble({ nameOutlineColor })} />
            </div>
            <label className="toggle-row"><input type="checkbox" checked={props.selectedBubble.nameOutline ?? false} onChange={(event) => props.onPatchBubble({ nameOutline: event.target.checked })} /><span>이름 외곽선</span></label>
            <Field label="프로필 위치">
              <select value={props.selectedBubble.side} onChange={(event) => props.onPatchBubble({ side: event.target.value as SpeechBubble["side"] })}>
                <option value="left">왼쪽</option>
                <option value="right">오른쪽</option>
              </select>
            </Field>
            <button className="secondary-button" type="button" onClick={() => props.onPatchBubble({ side: props.selectedBubble?.side === "left" ? "right" : "left" })}>
              <ArrowLeftRight aria-hidden="true" /> 좌우 바로 바꾸기
            </button>
            <button className="danger-button" type="button" onClick={props.onDeleteBubble}>
              <Trash2 aria-hidden="true" /> 말풍선 삭제
            </button>
          </Section>
        ) : null}

      </div>
    </>
  )
}

const BUILTIN_STICKERS: Array<{ kind: StickerKind; label: string; glyph: string }> = [
  { kind: "heart", label: "하트", glyph: "♡" },
  { kind: "star", label: "별", glyph: "☆" },
  { kind: "sparkle", label: "반짝이", glyph: "✦" },
  { kind: "flower", label: "꽃", glyph: "❀" },
  { kind: "smile", label: "스마일", glyph: "☺" },
  { kind: "leaf", label: "잎", glyph: "♧" },
  { kind: "moon", label: "달", glyph: "☾" },
]

function DecoratePanel(props: Props) {
  const [html, setHtml] = useState("")
  const preview = useMemo(() => sanitizeHtml(html), [html])
  return (
    <>
      <PanelHeader title={`스티커·HTML 카드 · ${props.selectedPage}쪽`} />
      <div className="panel-scroll">
        <Section title="스티커">
          <p className="section-note">누르면 현재 페이지 가운데에 붙어요. 페이지에서 끌어 이동하고 손잡이로 크기를 바꿀 수 있습니다. 움직이는 GIF도 그대로 붙고, 내보내기에서 <strong>움직이는 GIF로 저장</strong>을 고르면 글과 함께 애니메이션이 저장됩니다.</p>
          <div className="sticker-picker-grid">
            {BUILTIN_STICKERS.map((item) => (
              <button type="button" key={item.kind} onClick={() => props.onAddSticker(item.kind)} title={item.label}>
                <span>{item.glyph}</span><small>{item.label}</small>
              </button>
            ))}
          </div>
          <label className="file-button"><Sparkles aria-hidden="true" /><span>내 PNG·WebP·GIF 스티커 올리기</span><input type="file" accept="image/png,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && props.onUploadStickerAsset(event.target.files[0])} /></label>
          {props.document.stickerAssets.length ? (
            <div className="custom-sticker-list">
              {props.document.stickerAssets.map((asset) => (
                <div key={asset.id} className={asset.animated ? "is-animated" : undefined}>
                  <button type="button" onClick={() => props.onAddSticker("custom", asset.id)} title={asset.animated ? `${asset.name} · 움직이는 GIF ${asset.frameCount ?? 0}프레임` : asset.name}><img src={asset.src} alt={asset.name} /></button>
                  {asset.animated ? <span className="asset-animated-badge" title="움직이는 GIF">GIF</span> : null}
                  <button type="button" className="asset-delete" onClick={() => props.onDeleteStickerAsset(asset.id)} title="팔레트에서 삭제"><X aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          ) : null}
          {props.selectedSticker ? (
            <div className="selected-decoration-controls">
              <strong>선택한 스티커{isAnimatedSticker(props.selectedSticker) ? <span className="animated-tag">움직이는 GIF</span> : null}</strong>
              {props.selectedSticker.kind !== "custom" ? <ColorInput label="색" value={props.selectedSticker.color} onChange={(color) => props.onPatchSticker({ color })} /> : null}
              <RangeField label="크기" min={STICKER_MIN_SIZE} max={STICKER_MAX_SIZE} value={props.selectedSticker.size} suffix="px" onChange={(size) => props.onPatchSticker({ size })} />
              <RangeField label="투명도" min={0} max={100} value={Math.round((props.selectedSticker.opacity ?? 1) * 100)} suffix="%" onChange={(opacity) => props.onPatchSticker({ opacity: opacity / 100 })} />
              <RangeField label="회전" min={-180} max={180} value={props.selectedSticker.rotation} suffix="°" onChange={(rotation) => props.onPatchSticker({ rotation })} />
              <label className="toggle-row"><input type="checkbox" checked={props.selectedSticker.flipped} onChange={(event) => props.onPatchSticker({ flipped: event.target.checked })} /><span>좌우 반전</span></label>
              <button className="danger-button" type="button" onClick={props.onDeleteSticker}><Trash2 aria-hidden="true" /> 스티커 삭제</button>
            </div>
          ) : null}
        </Section>
        <Section title="HTML 카드">
          <Field label="HTML 코드" hint="script·이벤트 속성·위험한 URL은 자동 제거됩니다.">
            <textarea className="html-card-input" value={html} onChange={(event) => setHtml(event.target.value)} placeholder="<div style='padding:20px'>...</div>" />
          </Field>
          {preview ? <div className="html-card-preview" dangerouslySetInnerHTML={{ __html: preview }} /> : null}
          <button className="primary-button" type="button" onClick={() => { props.onAddHtmlCard(html); setHtml("") }} disabled={!preview}>커서 위치에 카드 넣기</button>
          {props.selectedHtmlCard ? (
            <div className="selected-decoration-controls">
              <strong>선택한 HTML 카드</strong>
              <div className="selection-toolbar" role="group" aria-label="HTML 카드 정렬">
                <button className={props.selectedHtmlCard.align === "left" ? "is-active" : ""} type="button" onClick={() => props.onPatchHtmlCard({ align: "left" })}><AlignLeft aria-hidden="true" /></button>
                <button className={props.selectedHtmlCard.align === "center" ? "is-active" : ""} type="button" onClick={() => props.onPatchHtmlCard({ align: "center" })}><AlignCenter aria-hidden="true" /></button>
                <button className={props.selectedHtmlCard.align === "right" ? "is-active" : ""} type="button" onClick={() => props.onPatchHtmlCard({ align: "right" })}><AlignRight aria-hidden="true" /></button>
              </div>
              <RangeField label="틀 너비" min={30} max={100} value={props.selectedHtmlCard.width} suffix="%" onChange={(width) => props.onPatchHtmlCard({ width })} />
              <RangeField label="카드 크기" min={50} max={180} value={props.selectedHtmlCard.scale} suffix="%" onChange={(scale) => props.onPatchHtmlCard({ scale })} />
              <label className="toggle-row"><input type="checkbox" checked={props.selectedHtmlCard.height === undefined} onChange={(event) => props.onPatchHtmlCard({ height: event.target.checked ? undefined : 220 })} /><span>내용 높이에 자동 맞춤</span></label>
              {props.selectedHtmlCard.height !== undefined ? <RangeField label="틀 높이" min={80} max={700} value={props.selectedHtmlCard.height} suffix="px" onChange={(height) => props.onPatchHtmlCard({ height })} /> : null}
              <RangeField label="가로 위치" min={-40} max={40} value={props.selectedHtmlCard.offsetX ?? 0} suffix="%" onChange={(offsetX) => props.onPatchHtmlCard({ offsetX })} />
              <RangeField label="세로 위치" min={-100} max={100} value={props.selectedHtmlCard.offsetY ?? 0} suffix="px" onChange={(offsetY) => props.onPatchHtmlCard({ offsetY })} />
              <button className="secondary-button" type="button" onClick={() => props.onPatchHtmlCard({ offsetX: 0, offsetY: 0, scale: 100 })}><RotateCcw aria-hidden="true" /> 위치·크기 초기화</button>
              <button className="danger-button" type="button" onClick={props.onDeleteHtmlCard}><Trash2 aria-hidden="true" /> HTML 카드 삭제</button>
            </div>
          ) : null}
        </Section>
      </div>
    </>
  )
}

function LayoutPanel(props: Props) {
  const options = props.document.options
  const [localFonts, setLocalFonts] = useState<string[]>([])
  const fonts = useMemo(() => Array.from(new Set([...FONT_OPTIONS, ...localFonts])), [localFonts])

  const loadLocalFonts = async () => {
    if (!window.queryLocalFonts) {
      props.onNotify("이 브라우저는 로컬 글꼴 목록 불러오기를 지원하지 않아요. 이름을 직접 입력할 수 있습니다.")
      return
    }
    try {
      const sources = await window.queryLocalFonts()
      setLocalFonts(Array.from(new Set(sources.map((font) => font.family))).sort((left, right) => left.localeCompare(right, "ko")))
      props.onNotify(`${sources.length}개의 로컬 글꼴을 확인했어요.`)
    } catch {
      props.onNotify("로컬 글꼴 접근이 허용되지 않았어요. 글꼴 이름을 직접 입력할 수 있습니다.")
    }
  }

  return (
    <>
      <PanelHeader
        title="지면과 활자"
        onReset={() => props.onPatchOptions({
          paperPreset: DEFAULT_OPTIONS.paperPreset,
          pageWidth: DEFAULT_OPTIONS.pageWidth,
          pageHeight: DEFAULT_OPTIONS.pageHeight,
          paddingX: DEFAULT_OPTIONS.paddingX,
          paddingY: DEFAULT_OPTIONS.paddingY,
          fontFamily: DEFAULT_OPTIONS.fontFamily,
          customFont: "",
          fontWeight: DEFAULT_OPTIONS.fontWeight,
          fontSize: DEFAULT_OPTIONS.fontSize,
          lineHeight: DEFAULT_OPTIONS.lineHeight,
          letterSpacing: DEFAULT_OPTIONS.letterSpacing,
          paragraphSpacing: DEFAULT_OPTIONS.paragraphSpacing,
          scaleX: DEFAULT_OPTIONS.scaleX,
          defaultTextAlign: DEFAULT_OPTIONS.defaultTextAlign,
          wordBreak: DEFAULT_OPTIONS.wordBreak,
        })}
      />
      <div className="panel-scroll">
        <Section title="페이지">
          <Field label="용지 사이즈">
            <select value={options.paperPreset} onChange={(event) => {
              const paperPreset = event.target.value as BookOptions["paperPreset"]
              props.onPatchOptions({ paperPreset, pageHeight: pageHeightForPreset(paperPreset, options.pageWidth, options.pageHeight) })
            }}>
              <option value="custom">자유 비율</option>
              <option value="a4">A4</option>
              <option value="a5">A5</option>
              <option value="b6">B6 문고본</option>
            </select>
          </Field>
          <RangeField label="페이지 너비" min={280} max={900} step={10} value={options.pageWidth} suffix="px" onChange={(pageWidth) => props.onPatchOptions({ pageWidth, pageHeight: pageHeightForPreset(options.paperPreset, pageWidth, options.pageHeight) })} />
          <RangeField label="페이지 높이" min={300} max={1600} step={10} value={options.pageHeight} suffix="px" onChange={(pageHeight) => props.onPatchOptions({ paperPreset: "custom", pageHeight })} />
          <RangeField label="가로 여백" min={24} max={110} value={options.paddingX} suffix="px" onChange={(paddingX) => props.onPatchOptions({ paddingX })} />
          <RangeField label="세로 여백" min={30} max={130} value={options.paddingY} suffix="px" onChange={(paddingY) => props.onPatchOptions({ paddingY })} />
          <button className="primary-button" type="button" onClick={props.onFitPageHeight}>선택 페이지 텍스트에 높이 맞추기</button>
        </Section>
        <Section title="글꼴">
          <Field label="기본 글꼴">
            <select value={options.fontFamily} onChange={(event) => props.onPatchOptions({ fontFamily: event.target.value, customFont: "" })}>
              {fonts.map((font) => <option key={font}>{font}</option>)}
            </select>
          </Field>
          <button className="secondary-button" type="button" onClick={loadLocalFonts}>
            <Type aria-hidden="true" /> 내 PC 글꼴 목록
          </button>
          <Field label="글꼴 이름 직접 입력">
            <input
              value={options.customFont}
              onFocus={props.onInputSessionStart}
              onChange={(event) => props.onPatchOptions({ customFont: event.target.value }, true)}
              onBlur={props.onInputSessionEnd}
              placeholder="예: KoPubWorldBatang"
            />
          </Field>
          <Field label="굵기">
            <select value={options.fontWeight} onChange={(event) => props.onPatchOptions({ fontWeight: Number(event.target.value) })}>
              <option value={300}>얇게</option>
              <option value={350}>약간 얇게</option>
              <option value={400}>보통</option>
              <option value={550}>약간 굵게</option>
              <option value={700}>굵게</option>
            </select>
          </Field>
        </Section>
        <Section title="조판" open={false}>
          <Field label="줄바꿈 기준">
            <select value={options.wordBreak} onChange={(event) => props.onPatchOptions({ wordBreak: event.target.value as BookOptions["wordBreak"] })}>
              <option value="keep-all">단어 단위</option>
              <option value="break-all">글자 단위</option>
            </select>
          </Field>
          <Field label="기본 문단 정렬">
            <select value={options.defaultTextAlign} onChange={(event) => props.onPatchOptions({ defaultTextAlign: event.target.value as BookOptions["defaultTextAlign"] })}>
              <option value="justify">양쪽 정렬</option>
              <option value="left">왼쪽 정렬</option>
              <option value="center">가운데 정렬</option>
              <option value="right">오른쪽 정렬</option>
            </select>
          </Field>
          <RangeField label="글자 크기" min={11} max={28} value={options.fontSize} suffix="px" onChange={(fontSize) => props.onPatchOptions({ fontSize })} />
          <RangeField label="행간" min={1.1} max={2.4} step={0.05} value={options.lineHeight} onChange={(lineHeight) => props.onPatchOptions({ lineHeight })} />
          <RangeField label="자간" min={-1} max={6} step={0.1} value={options.letterSpacing} suffix="px" onChange={(letterSpacing) => props.onPatchOptions({ letterSpacing })} />
          <RangeField label="문단 간격" min={0} max={40} value={options.paragraphSpacing} suffix="px" onChange={(paragraphSpacing) => props.onPatchOptions({ paragraphSpacing })} />
          <RangeField label="장평" min={0.8} max={1.2} step={0.01} value={options.scaleX} onChange={(scaleX) => props.onPatchOptions({ scaleX })} />
        </Section>
        <Section title="지면 색" open={false}>
          <div className="two-column-fields">
            <ColorInput label="종이" value={options.backgroundColor} onChange={(backgroundColor) => props.onPatchOptions({ backgroundColor })} />
            <ColorInput label="글자" value={options.textColor} onChange={(textColor) => props.onPatchOptions({ textColor })} />
          </div>
        </Section>
      </div>
    </>
  )
}

function BookPanel(props: Props) {
  const options = props.document.options
  const [metaScope, setMetaScope] = useState<"selected" | "all">("selected")
  const meta = props.currentPageMeta
  const footer = props.document.footers[props.selectedPage] ?? {
    title: props.document.title,
    subtitle: "",
    titleFont: options.fontFamily,
    subtitleFont: options.fontFamily,
    color: props.document.options.textColor,
    italic: false,
    weight: 400,
  }
  return (
    <>
      <PanelHeader title="책 정보·표지·꼬리말" />
      <div className="panel-scroll">
        <Section title="책 정보">
          <Field label="책 이름">
            <input value={props.document.title} onFocus={props.onInputSessionStart} onChange={(event) => props.onSetTitle(event.target.value, true)} onBlur={props.onInputSessionEnd} />
          </Field>
        </Section>
        <Section title={`페이지 제목·정보 · ${props.selectedPage}쪽`}>
          <Field label="적용 대상">
            <select value={metaScope} onChange={(event) => setMetaScope(event.target.value as "selected" | "all")}>
              <option value="selected">선택한 페이지만</option>
              <option value="all">모든 페이지</option>
            </select>
          </Field>
          <Field label="제목"><input value={meta.title} onChange={(event) => props.onPatchPageMeta({ title: event.target.value }, metaScope)} /></Field>
          <Field label="부제목"><input value={meta.subtitle} onChange={(event) => props.onPatchPageMeta({ subtitle: event.target.value }, metaScope)} /></Field>
          <Field label="책 이름"><input value={meta.bookName} onChange={(event) => props.onPatchPageMeta({ bookName: event.target.value }, metaScope)} /></Field>
          <Field label="캐릭터 이름"><input value={meta.characterName} onChange={(event) => props.onPatchPageMeta({ characterName: event.target.value }, metaScope)} /></Field>
          <Section title="제목 스타일" open={false}>
            <Field label="글꼴"><select value={meta.titleStyle.font} onChange={(event) => props.onPatchPageMeta({ titleStyle: { ...meta.titleStyle, font: event.target.value } }, metaScope)}>{FONT_OPTIONS.map((font) => <option value={font} key={font}>{font}</option>)}</select></Field>
            <RangeField label="크기" min={14} max={48} value={meta.titleStyle.size} suffix="px" onChange={(size) => props.onPatchPageMeta({ titleStyle: { ...meta.titleStyle, size } }, metaScope)} />
            <RangeField label="불투명도" min={0.1} max={1} step={0.05} value={meta.titleStyle.opacity} onChange={(opacity) => props.onPatchPageMeta({ titleStyle: { ...meta.titleStyle, opacity } }, metaScope)} />
            <ColorInput label="색" value={meta.titleStyle.color} onChange={(color) => props.onPatchPageMeta({ titleStyle: { ...meta.titleStyle, color } }, metaScope)} />
            <label className="toggle-row"><input type="checkbox" checked={meta.titleStyle.bold} onChange={(event) => props.onPatchPageMeta({ titleStyle: { ...meta.titleStyle, bold: event.target.checked } }, metaScope)} /><span>굵게</span></label>
            <label className="toggle-row"><input type="checkbox" checked={meta.titleStyle.italic} onChange={(event) => props.onPatchPageMeta({ titleStyle: { ...meta.titleStyle, italic: event.target.checked } }, metaScope)} /><span>기울임</span></label>
          </Section>
          <Section title="부제목 스타일" open={false}>
            <Field label="글꼴"><select value={meta.subtitleStyle.font} onChange={(event) => props.onPatchPageMeta({ subtitleStyle: { ...meta.subtitleStyle, font: event.target.value } }, metaScope)}>{FONT_OPTIONS.map((font) => <option value={font} key={font}>{font}</option>)}</select></Field>
            <RangeField label="크기" min={10} max={28} value={meta.subtitleStyle.size} suffix="px" onChange={(size) => props.onPatchPageMeta({ subtitleStyle: { ...meta.subtitleStyle, size } }, metaScope)} />
            <RangeField label="불투명도" min={0.1} max={1} step={0.05} value={meta.subtitleStyle.opacity} onChange={(opacity) => props.onPatchPageMeta({ subtitleStyle: { ...meta.subtitleStyle, opacity } }, metaScope)} />
            <ColorInput label="색" value={meta.subtitleStyle.color} onChange={(color) => props.onPatchPageMeta({ subtitleStyle: { ...meta.subtitleStyle, color } }, metaScope)} />
            <label className="toggle-row"><input type="checkbox" checked={meta.subtitleStyle.bold} onChange={(event) => props.onPatchPageMeta({ subtitleStyle: { ...meta.subtitleStyle, bold: event.target.checked } }, metaScope)} /><span>굵게</span></label>
            <label className="toggle-row"><input type="checkbox" checked={meta.subtitleStyle.italic} onChange={(event) => props.onPatchPageMeta({ subtitleStyle: { ...meta.subtitleStyle, italic: event.target.checked } }, metaScope)} /><span>기울임</span></label>
          </Section>
          <Section title="책·캐릭터 이름 스타일" open={false}>
            <Field label="책 이름 글꼴"><select value={meta.bookNameStyle.font} onChange={(event) => props.onPatchPageMeta({ bookNameStyle: { ...meta.bookNameStyle, font: event.target.value } }, metaScope)}>{FONT_OPTIONS.map((font) => <option value={font} key={font}>{font}</option>)}</select></Field>
            <RangeField label="책 이름 크기" min={9} max={24} value={meta.bookNameStyle.size} suffix="px" onChange={(size) => props.onPatchPageMeta({ bookNameStyle: { ...meta.bookNameStyle, size } }, metaScope)} />
            <ColorInput label="책 이름색" value={meta.bookNameStyle.color} onChange={(color) => props.onPatchPageMeta({ bookNameStyle: { ...meta.bookNameStyle, color } }, metaScope)} />
            <label className="toggle-row"><input type="checkbox" checked={meta.bookNameStyle.bold} onChange={(event) => props.onPatchPageMeta({ bookNameStyle: { ...meta.bookNameStyle, bold: event.target.checked } }, metaScope)} /><span>책 이름 굵게</span></label>
            <label className="toggle-row"><input type="checkbox" checked={meta.bookNameStyle.italic} onChange={(event) => props.onPatchPageMeta({ bookNameStyle: { ...meta.bookNameStyle, italic: event.target.checked } }, metaScope)} /><span>책 이름 기울임</span></label>
            <Field label="캐릭터 이름 글꼴"><select value={meta.characterNameStyle.font} onChange={(event) => props.onPatchPageMeta({ characterNameStyle: { ...meta.characterNameStyle, font: event.target.value } }, metaScope)}>{FONT_OPTIONS.map((font) => <option value={font} key={font}>{font}</option>)}</select></Field>
            <RangeField label="캐릭터 이름 크기" min={9} max={24} value={meta.characterNameStyle.size} suffix="px" onChange={(size) => props.onPatchPageMeta({ characterNameStyle: { ...meta.characterNameStyle, size } }, metaScope)} />
            <ColorInput label="캐릭터 이름색" value={meta.characterNameStyle.color} onChange={(color) => props.onPatchPageMeta({ characterNameStyle: { ...meta.characterNameStyle, color } }, metaScope)} />
            <label className="toggle-row"><input type="checkbox" checked={meta.characterNameStyle.bold} onChange={(event) => props.onPatchPageMeta({ characterNameStyle: { ...meta.characterNameStyle, bold: event.target.checked } }, metaScope)} /><span>캐릭터 이름 굵게</span></label>
            <label className="toggle-row"><input type="checkbox" checked={meta.characterNameStyle.italic} onChange={(event) => props.onPatchPageMeta({ characterNameStyle: { ...meta.characterNameStyle, italic: event.target.checked } }, metaScope)} /><span>캐릭터 이름 기울임</span></label>
          </Section>
        </Section>
        <Section title="표지">
          <Field label="표지 구성">
            <select value={options.coverMode} onChange={(event) => props.onPatchOptions({ coverMode: event.target.value as BookOptions["coverMode"] })}>
              <option value="image-text">그림 + 글자</option>
              <option value="image">그림만</option>
              <option value="text">글자만</option>
              <option value="none">표지 삭제</option>
            </select>
          </Field>
          <Field label="표지 제목">
            <input value={options.coverTitle} onFocus={props.onInputSessionStart} onChange={(event) => props.onPatchOptions({ coverTitle: event.target.value }, true)} onBlur={props.onInputSessionEnd} />
          </Field>
          <Field label="표지 제목 글꼴">
            <select value={options.coverTitleFont} onChange={(event) => props.onPatchOptions({ coverTitleFont: event.target.value })}>
              {FONT_OPTIONS.map((font) => <option value={font} key={font}>{font}</option>)}
            </select>
          </Field>
          <div className="two-column-fields">
            <ColorInput label="표지 제목색" value={options.coverTitleColor || (options.coverImage && options.coverMode === "image-text" ? "#ffffff" : options.textColor)} onChange={(coverTitleColor) => props.onPatchOptions({ coverTitleColor })} />
            <button className="secondary-button" type="button" onClick={() => props.onPatchOptions({ coverTitleColor: "" })}><RotateCcw aria-hidden="true" /> 자동색</button>
          </div>
          <Field label="표지 부제">
            <input value={options.coverSubtitle} onFocus={props.onInputSessionStart} onChange={(event) => props.onPatchOptions({ coverSubtitle: event.target.value }, true)} onBlur={props.onInputSessionEnd} />
          </Field>
          <Field label="표지 부제 글꼴">
            <select value={options.coverSubtitleFont} onChange={(event) => props.onPatchOptions({ coverSubtitleFont: event.target.value })}>
              {FONT_OPTIONS.map((font) => <option value={font} key={font}>{font}</option>)}
            </select>
          </Field>
          <div className="two-column-fields">
            <ColorInput label="표지 부제색" value={options.coverSubtitleColor || (options.coverImage && options.coverMode === "image-text" ? "#ffffff" : options.textColor)} onChange={(coverSubtitleColor) => props.onPatchOptions({ coverSubtitleColor })} />
            <button className="secondary-button" type="button" onClick={() => props.onPatchOptions({ coverSubtitleColor: "" })}><RotateCcw aria-hidden="true" /> 자동색</button>
          </div>
          <label className="file-button"><ImagePlus aria-hidden="true" /><span>표지 그림 불러오기</span><input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && props.onUploadCover(event.target.files[0])} /></label>
        </Section>
        <Section title={`꼬리말 · ${props.selectedPage}쪽`} open={false}>
          <Field label="제목"><input value={footer.title} onChange={(event) => props.onPatchFooter({ title: event.target.value })} /></Field>
          <Field label="제목 글꼴"><select value={footer.titleFont} onChange={(event) => props.onPatchFooter({ titleFont: event.target.value })}>{FONT_OPTIONS.map((font) => <option value={font} key={font}>{font}</option>)}</select></Field>
          <Field label="부제목"><input value={footer.subtitle} onChange={(event) => props.onPatchFooter({ subtitle: event.target.value })} placeholder="장 제목, 날짜, 메모" /></Field>
          <Field label="부제목 글꼴"><select value={footer.subtitleFont} onChange={(event) => props.onPatchFooter({ subtitleFont: event.target.value })}>{FONT_OPTIONS.map((font) => <option value={font} key={font}>{font}</option>)}</select></Field>
          <div className="two-column-fields">
            <ColorInput label="글자색" value={footer.color} onChange={(color) => props.onPatchFooter({ color })} />
            <Field label="굵기"><select value={footer.weight} onChange={(event) => props.onPatchFooter({ weight: Number(event.target.value) })}><option value={300}>얇게</option><option value={400}>보통</option><option value={600}>굵게</option></select></Field>
          </div>
          <label className="toggle-row"><input type="checkbox" checked={footer.italic} onChange={(event) => props.onPatchFooter({ italic: event.target.checked })} /><span>기울임</span></label>
          <div className="button-stack">
            <button className="primary-button" type="button" onClick={props.onApplyFooterAll}><Check aria-hidden="true" /> 모든 페이지에 적용</button>
            <button className="secondary-button" type="button" onClick={() => props.onDeleteFooter(false)}><RotateCcw aria-hidden="true" /> 이 페이지 꼬리말 지우기</button>
            <button className="secondary-button" type="button" onClick={() => props.onDeleteFooter(true)}><Trash2 aria-hidden="true" /> 모든 꼬리말 지우기</button>
          </div>
        </Section>
      </div>
    </>
  )
}

function ExportPanel(props: Props) {
  const importRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <PanelHeader title="저장과 내보내기" />
      <div className="panel-scroll">
        <Section title="페이지 선택">
          <div className="bubble-move-buttons">
            <button className="secondary-button" type="button" onClick={props.onSelectAllPages}><Check aria-hidden="true" /> 전체 선택</button>
            <button className="secondary-button" type="button" onClick={props.onSelectCurrentPage}><X aria-hidden="true" /> 현재 쪽만</button>
          </div>
          <p className="section-note">캔버스에서는 Ctrl 또는 ⌘를 누른 채 페이지를 눌러 여러 쪽을 고를 수 있어요.</p>
        </Section>
        <Section title="이미지로 저장">
          <button className="export-choice is-copy" type="button" onClick={props.onCopyPage}>
            <ClipboardCopy aria-hidden="true" />
            <span><strong>선택 페이지 복사</strong><small>PNG 이미지를 바로 붙여넣기</small></span>
          </button>
          <button className="export-choice" type="button" onClick={() => props.onExport("selected")}>
            <Download aria-hidden="true" />
            <span><strong>선택한 페이지만</strong><small>현재 페이지를 고해상도 PNG로 저장</small></span>
          </button>
          <button className="export-choice" type="button" onClick={() => props.onExport("single")}>
            <FileDown aria-hidden="true" />
            <span><strong>모든 페이지 낱장</strong><small>페이지별 PNG를 다운로드 폴더에 저장</small></span>
          </button>
          <button className="export-choice" type="button" onClick={() => props.onExport("spread")}>
            <BookSpreadIcon />
            <span><strong>양면 펼침</strong><small>표지+1쪽부터 묶어 다운로드 폴더에 저장</small></span>
          </button>
          <button className="export-choice is-animated" type="button" onClick={props.onExportGif}>
            <Film aria-hidden="true" />
            <span><strong>움직이는 GIF로 저장</strong><small>현재 쪽의 GIF 스티커·사진 움직임을 보존</small></span>
          </button>
        </Section>
        <Section title="작업 파일" open={false}>
          <button className="primary-button" type="button" onClick={props.onSaveTemporary}>
            <Save aria-hidden="true" /> 브라우저에 임시 저장
          </button>
          <button className="secondary-button" type="button" onClick={props.onDownloadProject}>
            <FileDown aria-hidden="true" /> 작업 파일 받기
          </button>
          <button className="secondary-button" type="button" onClick={() => importRef.current?.click()}>
            <FileUp aria-hidden="true" /> 작업 파일 불러오기
          </button>
          <input
            className="visually-hidden"
            ref={importRef}
            type="file"
            accept=".hamsterbook,.json,application/json,application/x-hamster-book+json"
            onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0] && props.onImportProject(event.target.files[0])}
          />
        </Section>
      </div>
    </>
  )
}

function BookSpreadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5.5c3.5-.8 6.5-.4 9 1.4v12c-2.5-1.8-5.5-2.2-9-1.4v-12Zm18 0c-3.5-.8-6.5-.4-9 1.4v12c2.5-1.8 5.5-2.2 9-1.4v-12Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}

export function Inspector(props: Props) {
  const content = {
    manuscript: <ManuscriptPanel {...props} />,
    theme: <ThemePanel {...props} />,
    image: <ImagePanel {...props} />,
    dialogue: <DialoguePanel {...props} />,
    decorate: <DecoratePanel {...props} />,
    layout: <LayoutPanel {...props} />,
    book: <BookPanel {...props} />,
    export: <ExportPanel {...props} />,
  }[props.activeTab]

  return (
    <aside className="inspector" aria-label="편집 설정" data-preserve-page-selection>
      <button className="inspector-close icon-button" type="button" onClick={props.onClose} title="설정 닫기">
        <X aria-hidden="true" />
      </button>
      <div className="inspector-stage" key={props.activeTab}>{content}</div>
    </aside>
  )
}
