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
  Highlighter,
  ImagePlus,
  Italic,
  MessageCircleMore,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Type,
  UserPlus,
  UserRound,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, CSSProperties, PointerEvent, ReactNode } from "react"
import { DEFAULT_OPTIONS, THEMES } from "../data/themes"
import { avatarFrame, avatarStyle, clampAvatarCenter } from "../lib/avatar"
import { fitImageToPage } from "../lib/image"
import type {
  BookDocument,
  BookOptions,
  DividerBlock,
  DividerStyle,
  EditorTab,
  ExportMode,
  FooterNote,
  ImageLayer,
  MarkKind,
  MemberProfile,
  SpeechBubble,
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
  textSelection: TextSelection | null
  members: MemberProfile[]
  customPresets: ThemePreset[]
  onClose: () => void
  onSetTitle: (title: string, transient?: boolean) => void
  onPatchOptions: (patch: Partial<BookOptions>, transient?: boolean) => void
  onApplyTheme: (theme: ThemePreset) => void
  onSavePreset: (name: string) => void
  onDeletePreset: (id: string) => void
  onAddMark: (start: number, end: number, kind: MarkKind, value: string) => void
  onSetAlign: (value: string) => void
  onClearMarks: () => void
  onUploadCover: (file: File) => void
  onAddImage: (file: File) => void
  onPatchImage: (patch: Partial<ImageLayer>) => void
  onDeleteImage: () => void
  onAddMember: () => string
  onPatchMember: (id: string, patch: Partial<MemberProfile>, transient?: boolean) => void
  onSetMemberAvatar: (id: string, file: File) => void
  onDeleteMemberAvatar: (id: string) => void
  onDeleteMember: (id: string) => void
  onAddBubble: (profileId: string, text: string, secondaryText: string, side: SpeechBubble["side"]) => void
  onPatchBubble: (patch: Partial<SpeechBubble>) => void
  onMoveBubble: (direction: -1 | 1) => void
  onInsertTextAfterBubble: () => void
  onDeleteBubble: () => void
  onAddDivider: (style: DividerStyle, color: string) => void
  onPatchDivider: (patch: Partial<DividerBlock>) => void
  onDeleteDivider: () => void
  onPatchFooter: (patch: Partial<FooterNote>) => void
  onApplyFooterAll: () => void
  onDeleteFooter: (all: boolean) => void
  onExport: (mode: ExportMode) => void
  onCopyPage: () => void
  onSaveTemporary: () => void
  onDownloadProject: () => void
  onImportProject: (file: File) => void
  onNotify: (message: string) => void
  onInputSessionStart: () => void
  onInputSessionEnd: () => void
}

function PanelHeader({ title, onReset }: { title: string; onReset?: () => void }) {
  const hint = title.startsWith("원고") ? "문장 포개기"
    : title.startsWith("전체 테마") ? "이불 고르기"
      : title.startsWith("이미지") ? "사진 붙이기"
        : title.startsWith("말풍선") ? "수다 떨기"
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
  return (
    <label className="color-input" title={label}>
      <input
        type="color"
        value={value}
        // Only commit on change (picker close); binding onInput too fired a
        // duplicate history entry for every event.
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <span style={{ background: value }} />
      <small>{label}</small>
    </label>
  )
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
  const addSelectionMark = (kind: MarkKind, value: string) => {
    const selection = props.textSelection
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
    ? props.document.marks.find((mark) => mark.kind === "align" && mark.start <= selection!.start && mark.end >= selection!.end)?.value ?? "left"
    : "left"

  return (
    <>
      <PanelHeader title="원고와 표지" />
      <div className="panel-scroll">
        <Section title="책 정보">
          <Field label="책 이름">
            <input
              value={props.document.title}
              onFocus={props.onInputSessionStart}
              onChange={(event) => props.onSetTitle(event.target.value, true)}
              onBlur={props.onInputSessionEnd}
            />
          </Field>
        </Section>
        <Section title="선택 글자 꾸미기">
          <div
            className="selection-toolbar"
            aria-label="선택한 글자 꾸미기"
            data-preserve-page-selection
            onPointerDown={(event) => event.preventDefault()}
          >
            <button className={hasSelectionMark("bold", "700") ? "is-active" : ""} type="button" onClick={() => addSelectionMark("bold", "700")} title="굵게">
              <Bold aria-hidden="true" />
            </button>
            <button className={hasSelectionMark("italic", "italic") ? "is-active" : ""} type="button" onClick={() => addSelectionMark("italic", "italic")} title="기울임">
              <Italic aria-hidden="true" />
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
              className={`highlight-button${hasSelectionMark("highlight", `${options.highlightColor}88`) ? " is-active" : ""}`}
              style={{ "--highlight": options.highlightColor } as CSSProperties}
              type="button"
              onClick={() => addSelectionMark("highlight", `${options.highlightColor}88`)}
              title="형광펜"
            >
              <Highlighter aria-hidden="true" />
            </button>
            <button type="button" onClick={props.onClearMarks} title="수동 서식 지우기">
              <RotateCcw aria-hidden="true" />
            </button>
          </div>
          <div
            className="selection-toolbar"
            aria-label="문단 정렬"
            data-preserve-page-selection
            onPointerDown={(event) => event.preventDefault()}
          >
            <button className={currentAlign === "left" ? "is-active" : ""} type="button" onClick={() => props.onSetAlign("left")} title="왼쪽 정렬">
              <AlignLeft aria-hidden="true" />
            </button>
            <button className={currentAlign === "center" ? "is-active" : ""} type="button" onClick={() => props.onSetAlign("center")} title="가운데 정렬">
              <AlignCenter aria-hidden="true" />
            </button>
            <button className={currentAlign === "right" ? "is-active" : ""} type="button" onClick={() => props.onSetAlign("right")} title="오른쪽 정렬">
              <AlignRight aria-hidden="true" />
            </button>
            <button className={currentAlign === "justify" ? "is-active" : ""} type="button" onClick={() => props.onSetAlign("justify")} title="양쪽 정렬">
              <AlignJustify aria-hidden="true" />
            </button>
          </div>
          <Field label="선택 글자 글꼴">
            <select
              value={selectionFont}
              disabled={!hasRange}
              onPointerDown={() => { fontSelectionRef.current = props.textSelection }}
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

        <Section title="보조색과 형광펜" open={false}>
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
          <ColorInput label="형광펜" value={options.highlightColor} onChange={(highlightColor) => props.onPatchOptions({ highlightColor })} />
        </Section>

        <Section title="구분선" open={false}>
          <div className="divider-style-grid" role="group" aria-label="구분선 모양">
            {(["solid", "dashed", "diamond", "dots"] as DividerStyle[]).map((style) => (
              <button
                className={dividerStyle === style ? `divider-style-button style-${style} is-active` : `divider-style-button style-${style}`}
                type="button"
                key={style}
                onClick={() => setDividerStyle(style)}
                title={style === "solid" ? "실선" : style === "dashed" ? "점선" : style === "diamond" ? "다이아" : "점 장식"}
                aria-label={style === "solid" ? "실선" : style === "dashed" ? "점선" : style === "diamond" ? "다이아" : "점 장식"}
              >
                <span />
                {style === "diamond" ? <i>◆ ◆ ◆</i> : null}
                {style === "dots" ? <i>● ● ●</i> : null}
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

        <Section title="표지" open={false}>
          <Field label="표지 구성">
            <select value={options.coverMode} onChange={(event) => props.onPatchOptions({ coverMode: event.target.value as BookOptions["coverMode"] })}>
              <option value="image-text">그림 + 글자</option>
              <option value="image">그림만</option>
              <option value="text">글자만</option>
              <option value="none">표지 삭제</option>
            </select>
          </Field>
          <Field label="표지 제목">
            <input
              value={options.coverTitle}
              onFocus={props.onInputSessionStart}
              onChange={(event) => props.onPatchOptions({ coverTitle: event.target.value }, true)}
              onBlur={props.onInputSessionEnd}
            />
          </Field>
          <div className="two-column-fields">
            <ColorInput
              label="표지 제목색"
              value={options.coverTitleColor || (options.coverImage && options.coverMode === "image-text" ? "#ffffff" : options.textColor)}
              onChange={(coverTitleColor) => props.onPatchOptions({ coverTitleColor })}
            />
            <button className="secondary-button" type="button" aria-label="표지 제목색 자동 적용" onClick={() => props.onPatchOptions({ coverTitleColor: "" })}>
              <RotateCcw aria-hidden="true" /> 자동색
            </button>
          </div>
          <Field label="표지 부제">
            <input
              value={options.coverSubtitle}
              onFocus={props.onInputSessionStart}
              onChange={(event) => props.onPatchOptions({ coverSubtitle: event.target.value }, true)}
              onBlur={props.onInputSessionEnd}
            />
          </Field>
          <div className="two-column-fields">
            <ColorInput
              label="표지 부제색"
              value={options.coverSubtitleColor || (options.coverImage && options.coverMode === "image-text" ? "#ffffff" : options.textColor)}
              onChange={(coverSubtitleColor) => props.onPatchOptions({ coverSubtitleColor })}
            />
            <button className="secondary-button" type="button" aria-label="표지 부제색 자동 적용" onClick={() => props.onPatchOptions({ coverSubtitleColor: "" })}>
              <RotateCcw aria-hidden="true" /> 자동색
            </button>
          </div>
          <label className="file-button">
            <ImagePlus aria-hidden="true" />
            <span>표지 그림 불러오기</span>
            <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && props.onUploadCover(event.target.files[0])} />
          </label>
        </Section>
      </div>
    </>
  )
}

function ThemePanel(props: Props) {
  const [presetName, setPresetName] = useState("")
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
            <button
              className={props.document.options.themeId === theme.id ? "theme-row is-active" : "theme-row"}
              type="button"
              key={theme.id}
              onClick={() => props.onApplyTheme(theme)}
            >
              <span className="theme-colors">
                {theme.colors.map((color) => <i key={color} style={{ background: color }} />)}
              </span>
              <span>
                <strong>{theme.name}</strong>
                <small>{theme.description}</small>
              </span>
              {theme.id.startsWith("custom-") ? (
                <span
                  className="theme-delete"
                  role="button"
                  tabIndex={0}
                  title="저장 테마 삭제"
                  onClick={(event) => {
                    event.stopPropagation()
                    props.onDeletePreset(theme.id)
                  }}
                >
                  <X aria-hidden="true" />
                </span>
              ) : props.document.options.themeId === theme.id ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
        <Section title="현재 설정을 테마로 저장">
          <Field label="테마 이름">
            <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="예: 겨울 편지" />
          </Field>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              props.onSavePreset(presetName)
              setPresetName("")
            }}
          >
            <Save aria-hidden="true" /> 저장
          </button>
        </Section>
      </div>
    </>
  )
}

function ImagePanel(props: Props) {
  const image = props.selectedImage
  return (
    <>
      <PanelHeader title={`이미지 레이어 · ${props.selectedPage}쪽`} />
      <div className="panel-scroll">
        <label className="image-drop-zone">
          <ImagePlus aria-hidden="true" />
          <strong>이미지 추가</strong>
          <span>파일 선택 또는 페이지 위로 끌어놓기</span>
          <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && props.onAddImage(event.target.files[0])} />
        </label>
        {image ? (
          <Section title={image.name}>
            <p className="shortcut-note"><kbd>Ctrl</kbd> + <kbd>T</kbd>로 캔버스 변형 핸들을 켤 수 있습니다.</p>
            <button className="primary-button" type="button" onClick={() => props.onPatchImage(fitImageToPage(image.aspectRatio ?? 1))}>
              <ImagePlus aria-hidden="true" /> 페이지 가득 채우기
            </button>
            <RangeField label="가로 위치" min={-500} max={100} value={image.x} suffix="%" onChange={(x) => props.onPatchImage({ x })} />
            <RangeField label="세로 위치" min={-500} max={100} value={image.y} suffix="%" onChange={(y) => props.onPatchImage({ y })} />
            <RangeField label="크기" min={8} max={500} value={image.width} suffix="%" onChange={(width) => props.onPatchImage({ width })} />
            <RangeField label="회전" min={-180} max={180} value={image.rotation} suffix="°" onChange={(rotation) => props.onPatchImage({ rotation })} />
            <RangeField label="투명도" min={0.05} max={1} step={0.05} value={image.opacity} onChange={(opacity) => props.onPatchImage({ opacity })} />
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
            <label className="file-button">
              <Camera aria-hidden="true" />
              <span>{selectedMember.avatar ? "프로필 사진 바꾸기" : "프로필 사진 추가"}</span>
              <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && props.onSetMemberAvatar(selectedMember.id, event.target.files[0])} />
            </label>
            {selectedMember.avatar ? (
              <>
                <AvatarCropper member={selectedMember} onChange={(patch) => props.onPatchMember(selectedMember.id, patch)} />
                <button className="secondary-button" type="button" onClick={() => props.onDeleteMemberAvatar(selectedMember.id)}>
                  <Trash2 aria-hidden="true" /> 사진만 삭제
                </button>
              </>
            ) : null}
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
              <button className="secondary-button" type="button" onClick={props.onInsertTextAfterBubble} title="이 말풍선 뒤에 본문 글을 써 넣어요">
                <Type aria-hidden="true" /> 말풍선 사이에 글 넣기
              </button>
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
          pageWidth: DEFAULT_OPTIONS.pageWidth,
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
        })}
      />
      <div className="panel-scroll">
        <Section title="페이지">
          <RangeField label="페이지 너비" min={340} max={680} step={10} value={options.pageWidth} suffix="px" onChange={(pageWidth) => props.onPatchOptions({ pageWidth })} />
          <RangeField label="가로 여백" min={24} max={110} value={options.paddingX} suffix="px" onChange={(paddingX) => props.onPatchOptions({ paddingX })} />
          <RangeField label="세로 여백" min={30} max={130} value={options.paddingY} suffix="px" onChange={(paddingY) => props.onPatchOptions({ paddingY })} />
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

function FooterPanel(props: Props) {
  const footer = props.document.footers[props.selectedPage] ?? {
    title: props.document.title,
    subtitle: "",
    color: props.document.options.textColor,
    italic: false,
    weight: 400,
  }
  return (
    <>
      <PanelHeader title={`페이지 꼬리말 · ${props.selectedPage}쪽`} onReset={() => props.onDeleteFooter(false)} />
      <div className="panel-scroll">
        <Field label="제목">
          <input value={footer.title} onChange={(event) => props.onPatchFooter({ title: event.target.value })} />
        </Field>
        <Field label="부제목">
          <input value={footer.subtitle} onChange={(event) => props.onPatchFooter({ subtitle: event.target.value })} placeholder="장 제목, 날짜, 메모" />
        </Field>
        <div className="two-column-fields">
          <ColorInput label="글자색" value={footer.color} onChange={(color) => props.onPatchFooter({ color })} />
          <Field label="굵기">
            <select value={footer.weight} onChange={(event) => props.onPatchFooter({ weight: Number(event.target.value) })}>
              <option value={300}>얇게</option>
              <option value={400}>보통</option>
              <option value={600}>굵게</option>
            </select>
          </Field>
        </div>
        <label className="toggle-row">
          <input type="checkbox" checked={footer.italic} onChange={(event) => props.onPatchFooter({ italic: event.target.checked })} />
          <span>기울임</span>
        </label>
        <div className="button-stack">
          <button className="primary-button" type="button" onClick={props.onApplyFooterAll}>
            <Check aria-hidden="true" /> 모든 페이지에 적용
          </button>
          <button className="secondary-button" type="button" onClick={() => props.onDeleteFooter(true)}>
            <Trash2 aria-hidden="true" /> 모든 꼬리말 지우기
          </button>
        </div>
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
            <span><strong>모든 페이지 낱장</strong><small>선택한 폴더에 PNG 파일로 한 장씩 저장</small></span>
          </button>
          <button className="export-choice" type="button" onClick={() => props.onExport("spread")}>
            <BookSpreadIcon />
            <span><strong>양면 펼침</strong><small>표지+1쪽부터 묶어 선택한 폴더에 PNG로 저장</small></span>
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
    layout: <LayoutPanel {...props} />,
    footer: <FooterPanel {...props} />,
    export: <ExportPanel {...props} />,
  }[props.activeTab]

  return (
    <aside className="inspector" aria-label="편집 설정">
      <button className="inspector-close icon-button" type="button" onClick={props.onClose} title="설정 닫기">
        <X aria-hidden="true" />
      </button>
      {content}
    </aside>
  )
}
