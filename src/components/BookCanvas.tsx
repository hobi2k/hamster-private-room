import { ArrowDown, ArrowUp, Check, RotateCw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, DragEvent, FocusEvent, FormEvent, MouseEvent, PointerEvent, ReactNode } from "react"
import { avatarStyle } from "../lib/avatar"
import { decoratePage } from "../lib/pagination"
import { DIALOGUE_LAYOUT_GAP, DIALOGUE_LAYOUT_MAX_BOTTOM, resolveSpeechBubbleTops, speechBubbleWidth } from "../lib/speech"
import type { BookDocument, DialogueTextBlock, ImageLayer, MemberProfile, PageSlice, SpeechBubble, TextSelection } from "../types"

type Props = {
  document: BookDocument
  pages: PageSlice[]
  selectedPage: number
  selectedPages: number[]
  selectedImageId: string
  selectedBubbleId: string
  transformMode: boolean
  onSelectPage: (page: number, additive?: boolean) => void
  onSelectImage: (id: string) => void
  onSelectBubble: (id: string) => void
  onAddImage: (file: File, page: number) => void
  onChangeImage: (id: string, patch: Partial<ImageLayer>) => void
  onDeleteImage: (id: string) => void
  onChangeBubble: (id: string, patch: Partial<SpeechBubble>) => void
  onMoveBubble: (id: string, direction: -1 | 1) => void
  onDeleteBubble: (id: string) => void
  onChangeDialogueText: (id: string, patch: Partial<DialogueTextBlock>) => void
  onSelectDialogueText: (afterBubbleId: string) => void
  onBubbleGapsChange: (page: number, gaps: Record<string, number>) => void
  onChangePageText: (start: number, end: number, text: string) => void
  onSelectText: (selection: TextSelection) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}

type PointerSession = {
  action: "move" | "resize" | "rotate"
  id: string
  startX: number
  startY: number
  pageRect: DOMRect
  layer: ImageLayer
  startAngle: number
}

type DialogueLayoutItem = {
  id: string
  y: number
  zIndex: number
} & ({ kind: "bubble"; bubble: SpeechBubble } | { kind: "text"; block: DialogueTextBlock; owner: SpeechBubble })

function TextContent({ document, page }: { document: BookDocument; page: PageSlice }) {
  let offset = 0
  return decoratePage(document.body, page, document.marks, document.options).map((slice, index) => {
    const bits = slice.text.split(/(\n\n|\n)/)
    return bits.map((bit, bitIndex) => {
      const textOffset = offset
      offset += bit.length
      if (bit === "\n\n") {
        return <span className="paragraph-gap" data-text-offset={textOffset} style={{ height: document.options.paragraphSpacing }} key={`${index}-${bitIndex}`} />
      }
      if (bit === "\n") return <br data-text-offset={textOffset} key={`${index}-${bitIndex}`} />
      return (
        <span data-text-offset={textOffset} style={slice.style} key={`${index}-${bitIndex}`}>
          {bit}
        </span>
      )
    })
  })
}

function DraftTextContent({ document, page, text }: { document: BookDocument; page: PageSlice; text: string }) {
  const body = `${document.body.slice(0, page.start)}${text}${document.body.slice(page.end)}`
  const draftPage = { text, start: page.start, end: page.start + text.length }
  return decoratePage(body, draftPage, document.marks, document.options).map((slice, index) => (
    <span style={slice.style} key={index}>{slice.text}</span>
  ))
}

function PageTextEditor({
  document,
  page,
  editing,
  onStartEditing,
  onSelectPage,
  onFinishEditing,
  onChange,
  onSelectText,
  onInteractionStart,
  onInteractionEnd,
}: {
  document: BookDocument
  page: PageSlice
  editing: boolean
  onStartEditing: () => void
  onSelectPage: (additive: boolean) => void
  onFinishEditing: () => void
  onChange: (start: number, end: number, text: string) => void
  onSelectText: (selection: TextSelection) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const [draft, setDraft] = useState(page.text)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const requestedCaret = useRef(0)
  const selectText = useRef(onSelectText)
  const dirty = useRef(false)
  const finishTimer = useRef<number | null>(null)

  useEffect(() => {
    selectText.current = onSelectText
  }, [onSelectText])

  useEffect(() => {
    if (!editing) setDraft(page.text)
  }, [editing, page.text])

  useLayoutEffect(() => {
    if (!editing) return
    const editor = editorRef.current
    if (!editor) return
    const caret = Math.min(requestedCaret.current, editor.value.length)
    editor.focus({ preventScroll: true })
    editor.setSelectionRange(caret, caret)
    const frame = window.requestAnimationFrame(() => {
      if (overlayRef.current) overlayRef.current.style.transform = `translateY(${-editor.scrollTop}px)`
    })
    selectText.current({ start: page.start + caret, end: page.start + caret })
    return () => window.cancelAnimationFrame(frame)
  }, [editing, page.start])

  const updateSelection = () => {
    const editor = editorRef.current
    if (!editor) return
    onSelectText({ start: page.start + editor.selectionStart, end: page.start + editor.selectionEnd })
  }

  const finishEditing = useCallback(() => {
    onFinishEditing()
    if (dirty.current) {
      onChange(page.start, page.end, draft)
      dirty.current = false
      onInteractionEnd()
    }
  }, [draft, onChange, onFinishEditing, onInteractionEnd, page.end, page.start])

  const scheduleFinishEditing = useCallback(() => {
    if (finishTimer.current !== null) return
    finishTimer.current = window.setTimeout(() => {
      finishTimer.current = null
      finishEditing()
    })
  }, [finishEditing])

  useEffect(() => {
    if (!editing) return
    const finishOutside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && editorRef.current?.contains(event.target)) return
      if (event.target instanceof Element && event.target.closest("[data-preserve-page-selection]")) return
      scheduleFinishEditing()
    }
    window.document.addEventListener("pointerdown", finishOutside, true)
    return () => window.document.removeEventListener("pointerdown", finishOutside, true)
  }, [editing, scheduleFinishEditing])

  if (editing) {
    return (
      <>
        <div className="page-copy page-copy-editor-preview" aria-hidden="true">
          <div ref={overlayRef}>
            <DraftTextContent document={document} page={page} text={draft} />
          </div>
        </div>
        <textarea
          ref={editorRef}
          className="page-copy page-copy-editor"
          value={draft}
          onChange={(event) => {
            if (!dirty.current) onInteractionStart()
            dirty.current = true
            setDraft(event.target.value)
          }}
          onScroll={(event) => {
            if (overlayRef.current) overlayRef.current.style.transform = `translateY(${-event.currentTarget.scrollTop}px)`
          }}
          onSelect={updateSelection}
          onKeyUp={updateSelection}
          onBlur={scheduleFinishEditing}
          onClick={(event) => event.stopPropagation()}
          spellCheck={false}
          aria-label="페이지 본문 편집"
        />
      </>
    )
  }

  return (
    <div
      className="page-copy page-copy-preview"
      onClick={(event) => {
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey) {
          onSelectPage(true)
          return
        }
        const position = window.document.caretPositionFromPoint?.(event.clientX, event.clientY)
        const target = position?.offsetNode instanceof Element ? position.offsetNode : position?.offsetNode.parentElement
        const segment = target?.closest<HTMLElement>("[data-text-offset]")
        requestedCaret.current = Math.max(0, Math.min(page.text.length,
          Number(segment?.dataset.textOffset ?? 0) + (position?.offsetNode.nodeType === Node.TEXT_NODE ? position.offset : 0),
        ))
        onStartEditing()
      }}
      title="본문 편집"
    >
      <TextContent document={document} page={page} />
    </div>
  )
}

function ImageItem({
  layer,
  selected,
  transformMode,
  onSelect,
  onChange,
  onDelete,
  onInteractionStart,
  onInteractionEnd,
}: {
  layer: ImageLayer
  selected: boolean
  transformMode: boolean
  onSelect: () => void
  onChange: (patch: Partial<ImageLayer>) => void
  onDelete: () => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const session = useRef<PointerSession | null>(null)

  const start = (event: PointerEvent<HTMLDivElement>, action: PointerSession["action"]) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect()
    const page = event.currentTarget.closest<HTMLElement>("[data-book-page]")
    if (!page) return
    const pageRect = page.getBoundingClientRect()
    const centerX = pageRect.left + ((layer.x + layer.width / 2) / 100) * pageRect.width
    const centerY = pageRect.top + (layer.y / 100) * pageRect.height + (layer.width / 200) * pageRect.width
    session.current = {
      action,
      id: layer.id,
      startX: event.clientX,
      startY: event.clientY,
      pageRect,
      layer,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    onInteractionStart()
  }

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = session.current
    if (!current) return
    const dx = ((event.clientX - current.startX) / current.pageRect.width) * 100
    const dy = ((event.clientY - current.startY) / current.pageRect.height) * 100
    if (current.action === "move") {
      const height = current.layer.width / ((current.layer.aspectRatio ?? 1) * 1.414)
      onChange({
        x: Math.max(-current.layer.width + 3, Math.min(97, current.layer.x + dx)),
        y: Math.max(-height + 3, Math.min(97, current.layer.y + dy)),
      })
      return
    }
    if (current.action === "resize") {
      onChange({ width: Math.max(8, Math.min(500, current.layer.width + dx)) })
      return
    }
    const centerX = current.pageRect.left + ((current.layer.x + current.layer.width / 2) / 100) * current.pageRect.width
    const centerY = current.pageRect.top + (current.layer.y / 100) * current.pageRect.height + (current.layer.width / (200 * (current.layer.aspectRatio ?? 1))) * current.pageRect.width
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI)
    onChange({ rotation: Math.round(current.layer.rotation + angle - current.startAngle) })
  }

  const end = (event: PointerEvent<HTMLDivElement>) => {
    if (!session.current) return
    session.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
    onInteractionEnd()
  }

  return (
    <div
      className={selected ? "image-layer is-selected" : "image-layer"}
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: `${layer.width}%`,
        opacity: layer.opacity,
        zIndex: layer.zIndex + 10,
        transform: `rotate(${layer.rotation}deg)`,
      }}
      onPointerDown={(event) => start(event, "move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      data-image-layer={layer.id}
    >
      <img
        src={layer.src}
        alt={layer.name}
        draggable={false}
        onLoad={(event) => {
          if (layer.aspectRatio) return
          onChange({ aspectRatio: event.currentTarget.naturalWidth / Math.max(1, event.currentTarget.naturalHeight) })
        }}
      />
      {selected && transformMode ? (
        <>
          <button className="layer-delete" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onDelete} title="이미지 삭제">
            <Trash2 aria-hidden="true" />
          </button>
          <div className="resize-handle" onPointerDown={(event) => start(event, "resize")} title="크기 조절" />
          <div className="rotate-handle" onPointerDown={(event) => start(event, "rotate")} title="회전">
            <RotateCw aria-hidden="true" />
          </div>
        </>
      ) : null}
    </div>
  )
}

function SpeechBubbleItem({
  bubble,
  top,
  profile,
  selected,
  onSelect,
  onChange,
  onMove,
  onDelete,
  onInteractionStart,
  onInteractionEnd,
}: {
  bubble: SpeechBubble
  top: number
  profile: MemberProfile | null
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<SpeechBubble>) => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const textEdit = useRef<{ started: boolean } | null>(null)
  const avatar = profile?.avatar ?? ""
  const speakerName = profile?.name ?? bubble.speakerName
  const bubbleColor = profile?.bubbleColor ?? bubble.bubbleColor
  const textColor = profile?.textColor ?? bubble.textColor

  const startTextEdit = (event: FocusEvent<HTMLElement>) => {
    event.stopPropagation()
    onSelect()
    textEdit.current = { started: false }
  }

  const changeTextEdit = (event: FormEvent<HTMLElement>) => {
    event.stopPropagation()
    if (!textEdit.current || textEdit.current.started) return
    textEdit.current.started = true
    onInteractionStart()
  }

  const finishTextEdit = (field: "text" | "secondaryText", event: FocusEvent<HTMLElement>) => {
    const current = textEdit.current
    textEdit.current = null
    if (!current?.started) return
    onChange({ [field]: event.currentTarget.innerText })
    onInteractionEnd()
  }

  const avatarNode = avatar ? (
    <span className="speech-avatar">
      <img
        src={avatar}
        alt={`${speakerName} 프로필`}
        draggable={false}
        style={profile ? avatarStyle(profile) : undefined}
      />
    </span>
  ) : null
  const cardNode = (
    <div className="speech-card">
      {speakerName && bubble.showName !== false ? <strong>{speakerName}</strong> : null}
      <p
        contentEditable={selected}
        suppressContentEditableWarning
        data-bubble-editor
        onFocus={startTextEdit}
        onInput={changeTextEdit}
        onBlur={(event) => finishTextEdit("text", event)}
      >
        {bubble.text}
      </p>
      <small
        contentEditable={selected}
        suppressContentEditableWarning
        data-bubble-editor
        data-placeholder="보조 문장"
        onFocus={startTextEdit}
        onInput={changeTextEdit}
        onBlur={(event) => finishTextEdit("secondaryText", event)}
      >
        {bubble.secondaryText}
      </small>
    </div>
  )

  return (
    <div
      className={`speech-layer side-${bubble.side}${avatar ? " has-avatar" : " is-text-only"}${selected ? " is-selected" : ""}${bubble.y < 8 ? " is-near-top" : ""}`}
      style={{
        left: bubble.side === "left" ? "8%" : "auto",
        right: bubble.side === "right" ? "8%" : "auto",
        top: `${top}%`,
        width: `${bubble.autoWidth === false ? bubble.width : speechBubbleWidth(bubble, speakerName, Boolean(avatar))}%`,
        zIndex: bubble.zIndex + 10,
        "--bubble-color": bubbleColor,
        "--bubble-text": textColor,
        "--bubble-message-size": `${2.9 * ((bubble.textScale ?? 100) / 100)}cqw`,
        "--bubble-secondary-size": `${2.1 * ((bubble.secondaryTextScale ?? 100) / 100)}cqw`,
      } as CSSProperties}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      data-speech-bubble={bubble.id}
      data-dialogue-layout-id={`bubble:${bubble.id}`}
    >
      {bubble.side === "left" ? avatarNode : null}
      {cardNode}
      {bubble.side === "right" ? avatarNode : null}
      {selected ? (
        <div className="speech-toolbar" role="toolbar" aria-label="말풍선 위치" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => onMove(-1)} title="말풍선 위로 이동" aria-label="말풍선 위로 이동">
            <ArrowUp aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onMove(1)} title="말풍선 아래로 이동" aria-label="말풍선 아래로 이동">
            <ArrowDown aria-hidden="true" />
          </button>
          <button className="speech-delete" type="button" onClick={onDelete} title="말풍선 삭제" aria-label="말풍선 삭제">
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

function DialogueTextItem({
  block,
  owner,
  top,
  selected,
  onSelect,
  onChange,
  onInteractionStart,
  onInteractionEnd,
}: {
  block: DialogueTextBlock
  owner: SpeechBubble
  top: number
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<DialogueTextBlock>) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const textEdit = useRef<{ started: boolean } | null>(null)

  return (
    <div
      className={selected ? "dialogue-text-block is-selected" : "dialogue-text-block"}
      style={{
        top: `${top}%`,
        color: block.color,
        fontStyle: block.italic ? "italic" : "normal",
        fontWeight: block.weight,
        zIndex: owner.zIndex + 10,
      }}
      data-dialogue-layout-id={`text:${block.id}`}
      data-dialogue-text={block.id}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <p
        contentEditable={selected}
        suppressContentEditableWarning
        onFocus={(event) => {
          event.stopPropagation()
          onSelect()
          textEdit.current = { started: false }
        }}
        onInput={(event) => {
          event.stopPropagation()
          if (!textEdit.current || textEdit.current.started) return
          textEdit.current.started = true
          onInteractionStart()
        }}
        onBlur={(event) => {
          const current = textEdit.current
          textEdit.current = null
          if (!current?.started) return
          onChange({ text: event.currentTarget.innerText })
          onInteractionEnd()
        }}
      >
        {block.text}
      </p>
    </div>
  )
}

function DropPage({
  page,
  selected,
  multiSelected,
  document,
  children,
  selectedImageId,
  selectedBubbleId,
  transformMode,
  onSelectPage,
  onSelectImage,
  onSelectBubble,
  onAddImage,
  onChangeImage,
  onDeleteImage,
  onChangeBubble,
  onMoveBubble,
  onDeleteBubble,
  onChangeDialogueText,
  onSelectDialogueText,
  onBubbleGapsChange,
  onInteractionStart,
  onInteractionEnd,
}: {
  page: number
  selected: boolean
  multiSelected: boolean
  document: BookDocument
  children: ReactNode
  selectedImageId: string
  selectedBubbleId: string
  transformMode: boolean
  onSelectPage: (additive: boolean) => void
  onSelectImage: (id: string) => void
  onSelectBubble: (id: string) => void
  onAddImage: (file: File) => void
  onChangeImage: (id: string, patch: Partial<ImageLayer>) => void
  onDeleteImage: (id: string) => void
  onChangeBubble: (id: string, patch: Partial<SpeechBubble>) => void
  onMoveBubble: (id: string, direction: -1 | 1) => void
  onDeleteBubble: (id: string) => void
  onChangeDialogueText: (id: string, patch: Partial<DialogueTextBlock>) => void
  onSelectDialogueText: (afterBubbleId: string) => void
  onBubbleGapsChange: (page: number, gaps: Record<string, number>) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const pageRef = useRef<HTMLElement>(null)
  const [layoutTops, setLayoutTops] = useState<Record<string, number>>({})
  const options = document.options
  const pageBubbles = useMemo(() => document.speechBubbles
    .filter((bubble) => bubble.page === page)
    .sort((left, right) => left.y - right.y || left.zIndex - right.zIndex), [document.speechBubbles, page])
  const pageDialogueTexts = useMemo(() => document.dialogueTexts.filter((block) => block.page === page), [document.dialogueTexts, page])
  const pageLayoutItems = useMemo(() => pageBubbles.flatMap<DialogueLayoutItem>((bubble) => [
    { id: `bubble:${bubble.id}`, kind: "bubble", bubble, y: bubble.y, zIndex: bubble.zIndex },
    ...pageDialogueTexts
      .filter((block) => block.afterBubbleId === bubble.id)
      .map((block) => ({ id: `text:${block.id}`, kind: "text" as const, block, owner: bubble, y: bubble.y, zIndex: bubble.zIndex + 0.1 })),
  ]).sort((left, right) => left.y - right.y || left.zIndex - right.zIndex), [pageBubbles, pageDialogueTexts])
  const measureSpeechBubbles = useCallback(() => {
    const pageElement = pageRef.current
    if (!pageElement?.clientHeight) return
    const elements = Array.from(pageElement.querySelectorAll<HTMLElement>("[data-dialogue-layout-id]"))
    const heights = new Map(elements.map((element) => [element.dataset.dialogueLayoutId ?? "", (element.getBoundingClientRect().height / pageElement.clientHeight) * 100]))
    const next = resolveSpeechBubbleTops(pageLayoutItems.map((item) => ({
      id: item.id,
      y: item.y,
      zIndex: item.zIndex,
      height: heights.get(item.id) ?? 0,
    })))
    setLayoutTops((current) => {
      const ids = Object.keys(next)
      const unchanged = ids.length === Object.keys(current).length
        && ids.every((id) => Math.abs((current[id] ?? -100) - next[id]) < 0.05)
      return unchanged ? current : next
    })
    const gaps = Object.fromEntries(pageBubbles.map((bubble) => {
      const id = `bubble:${bubble.id}`
      const index = pageLayoutItems.findIndex((item) => item.id === id)
      const nextItem = pageLayoutItems[index + 1]
      const bottom = (next[id] ?? bubble.y) + (heights.get(id) ?? 0)
      const nextTop = nextItem ? next[nextItem.id] : DIALOGUE_LAYOUT_MAX_BOTTOM
      const reservedGap = nextItem ? DIALOGUE_LAYOUT_GAP * 2 : DIALOGUE_LAYOUT_GAP
      return [bubble.id, Math.max(0, nextTop - bottom - reservedGap)]
    }))
    onBubbleGapsChange(page, gaps)
  }, [onBubbleGapsChange, page, pageBubbles, pageLayoutItems])

  useLayoutEffect(() => {
    const pageElement = pageRef.current
    if (!pageElement) return
    measureSpeechBubbles()
    const observer = new ResizeObserver(measureSpeechBubbles)
    observer.observe(pageElement)
    pageElement.querySelectorAll<HTMLElement>("[data-dialogue-layout-id]").forEach((element) => observer.observe(element))
    let cancelled = false
    void window.document.fonts.ready.then(() => {
      if (!cancelled) measureSpeechBubbles()
    })
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [document.members, measureSpeechBubbles, selectedBubbleId])

  const style = {
    "--page-width": `${options.pageWidth}px`,
    "--page-padding-x": `${(options.paddingX / options.pageWidth) * 100}%`,
    "--page-padding-y": `${(options.paddingY / (options.pageWidth * 1.414)) * 100}%`,
    "--page-color": options.textColor,
    "--page-background": options.backgroundColor,
    "--page-font": options.customFont ? `"${options.customFont}", "Noto Serif KR", serif` : `"${options.fontFamily}", "Noto Serif KR", serif`,
    "--page-font-size": `${(options.fontSize / options.pageWidth) * 100}cqw`,
    "--page-font-weight": String(options.fontWeight),
    "--page-line-height": String(options.lineHeight),
    "--page-letter-spacing": `${(options.letterSpacing / options.pageWidth) * 100}cqw`,
    "--page-scale-x": String(options.scaleX),
  } as CSSProperties

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/"))
    if (file) onAddImage(file)
  }

  return (
    <article
      ref={pageRef}
      className={`book-page texture-${options.pageTexture}${selected ? " is-selected" : ""}${multiSelected ? " is-multi-selected" : ""}`}
      style={style}
      data-book-page
      data-page-index={page}
      onClick={(event: MouseEvent<HTMLElement>) => onSelectPage(event.ctrlKey || event.metaKey)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      {multiSelected ? <span className="page-selection-badge"><Check aria-hidden="true" /></span> : null}
      {children}
      {document.images
        .filter((image) => image.page === page)
        .sort((left, right) => left.zIndex - right.zIndex)
        .map((image) => (
          <ImageItem
            key={image.id}
            layer={image}
            selected={image.id === selectedImageId}
            transformMode={transformMode}
            onSelect={() => onSelectImage(image.id)}
            onChange={(patch) => onChangeImage(image.id, patch)}
            onDelete={() => onDeleteImage(image.id)}
            onInteractionStart={onInteractionStart}
            onInteractionEnd={onInteractionEnd}
          />
        ))}
      {pageLayoutItems.map((item) => item.kind === "bubble" ? (
          <SpeechBubbleItem
            key={item.id}
            bubble={item.bubble}
            top={layoutTops[item.id] ?? item.bubble.y}
            profile={document.members.find((member) => member.id === item.bubble.profileId) ?? null}
            selected={item.bubble.id === selectedBubbleId}
            onSelect={() => onSelectBubble(item.bubble.id)}
            onChange={(patch) => onChangeBubble(item.bubble.id, patch)}
            onMove={(direction) => onMoveBubble(item.bubble.id, direction)}
            onDelete={() => onDeleteBubble(item.bubble.id)}
            onInteractionStart={onInteractionStart}
            onInteractionEnd={onInteractionEnd}
          />
        ) : (
          <DialogueTextItem
            key={item.id}
            block={item.block}
            owner={item.owner}
            top={layoutTops[item.id] ?? item.owner.y}
            selected={item.block.afterBubbleId === selectedBubbleId}
            onSelect={() => onSelectDialogueText(item.block.afterBubbleId)}
            onChange={(patch) => onChangeDialogueText(item.block.id, patch)}
            onInteractionStart={onInteractionStart}
            onInteractionEnd={onInteractionEnd}
          />
        ))}
      {document.footers[page] ? (
        <footer
          className="page-footer-note"
          style={{
            color: document.footers[page].color,
            fontStyle: document.footers[page].italic ? "italic" : "normal",
            fontWeight: document.footers[page].weight,
          }}
        >
          <strong>{document.footers[page].title}</strong>
          <span>{document.footers[page].subtitle}</span>
        </footer>
      ) : null}
      {page > 0 ? <span className="page-number">{page}</span> : null}
      <span className="drop-hint">이미지를 여기에 놓기</span>
    </article>
  )
}

export function BookCanvas(props: Props) {
  const [editingPage, setEditingPage] = useState<number | null>(null)
  const coverVisible = props.document.options.coverMode !== "none"
  const coverHasImage = props.document.options.coverMode === "image" || props.document.options.coverMode === "image-text"
  const coverHasText = props.document.options.coverMode === "text" || props.document.options.coverMode === "image-text"

  return (
    <section className="book-canvas" aria-label="책 미리보기">
      {coverVisible ? (
        <DropPage
          page={0}
          selected={props.selectedPage === 0}
          multiSelected={props.selectedPages.length > 1 && props.selectedPages.includes(0)}
          document={props.document}
          selectedImageId={props.selectedImageId}
          selectedBubbleId={props.selectedBubbleId}
          transformMode={props.transformMode}
          onSelectPage={(additive) => props.onSelectPage(0, additive)}
          onSelectImage={props.onSelectImage}
          onSelectBubble={props.onSelectBubble}
          onAddImage={(file) => props.onAddImage(file, 0)}
          onChangeImage={props.onChangeImage}
          onDeleteImage={props.onDeleteImage}
          onChangeBubble={props.onChangeBubble}
          onMoveBubble={props.onMoveBubble}
          onDeleteBubble={props.onDeleteBubble}
          onChangeDialogueText={props.onChangeDialogueText}
          onSelectDialogueText={props.onSelectDialogueText}
          onBubbleGapsChange={props.onBubbleGapsChange}
          onInteractionStart={props.onInteractionStart}
          onInteractionEnd={props.onInteractionEnd}
        >
          {coverHasImage && props.document.options.coverImage ? (
            <img className="cover-image" src={props.document.options.coverImage} alt="표지" />
          ) : null}
          {coverHasText ? (
            <div className={coverHasImage && props.document.options.coverImage ? "cover-copy is-over-image" : "cover-copy"}>
              <h1 style={props.document.options.coverTitleColor ? { color: props.document.options.coverTitleColor } : undefined}>
                {props.document.options.coverTitle || props.document.title}
              </h1>
              <p style={props.document.options.coverSubtitleColor ? { color: props.document.options.coverSubtitleColor } : undefined}>
                {props.document.options.coverSubtitle}
              </p>
            </div>
          ) : null}
        </DropPage>
      ) : null}
      {props.pages.map((page, index) => {
        const pageNumber = index + 1
        return (
          <DropPage
            key={`page-${pageNumber}`}
            page={pageNumber}
            selected={props.selectedPage === pageNumber}
            multiSelected={props.selectedPages.length > 1 && props.selectedPages.includes(pageNumber)}
            document={props.document}
            selectedImageId={props.selectedImageId}
            selectedBubbleId={props.selectedBubbleId}
            transformMode={props.transformMode}
            onSelectPage={(additive) => props.onSelectPage(pageNumber, additive)}
            onSelectImage={props.onSelectImage}
            onSelectBubble={props.onSelectBubble}
            onAddImage={(file) => props.onAddImage(file, pageNumber)}
            onChangeImage={props.onChangeImage}
            onDeleteImage={props.onDeleteImage}
            onChangeBubble={props.onChangeBubble}
            onMoveBubble={props.onMoveBubble}
            onDeleteBubble={props.onDeleteBubble}
            onChangeDialogueText={props.onChangeDialogueText}
            onSelectDialogueText={props.onSelectDialogueText}
            onBubbleGapsChange={props.onBubbleGapsChange}
            onInteractionStart={props.onInteractionStart}
            onInteractionEnd={props.onInteractionEnd}
          >
            <PageTextEditor
              document={props.document}
              page={page}
              editing={editingPage === pageNumber}
              onSelectPage={(additive) => props.onSelectPage(pageNumber, additive)}
              onStartEditing={() => {
                props.onSelectPage(pageNumber)
                setEditingPage(pageNumber)
              }}
              onFinishEditing={() => setEditingPage(null)}
              onChange={props.onChangePageText}
              onSelectText={props.onSelectText}
              onInteractionStart={props.onInteractionStart}
              onInteractionEnd={props.onInteractionEnd}
            />
          </DropPage>
        )
      })}
    </section>
  )
}
