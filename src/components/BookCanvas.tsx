import { RotateCw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, DragEvent, FocusEvent, FormEvent, PointerEvent, ReactNode } from "react"
import { decoratePage } from "../lib/pagination"
import type { BookDocument, ImageLayer, MemberProfile, PageSlice, SpeechBubble, TextSelection } from "../types"

type Props = {
  document: BookDocument
  pages: PageSlice[]
  selectedPage: number
  selectedImageId: string
  selectedBubbleId: string
  transformMode: boolean
  onSelectPage: (page: number) => void
  onSelectImage: (id: string) => void
  onSelectBubble: (id: string) => void
  onAddImage: (file: File, page: number) => void
  onChangeImage: (id: string, patch: Partial<ImageLayer>) => void
  onDeleteImage: (id: string) => void
  onChangeBubble: (id: string, patch: Partial<SpeechBubble>) => void
  onDeleteBubble: (id: string) => void
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

type BubblePointerSession = {
  id: string
  startX: number
  startY: number
  pageRect: DOMRect
  bubble: SpeechBubble
}

function TextContent({ document, page }: { document: BookDocument; page: PageSlice }) {
  return decoratePage(document.body, page, document.marks, document.options).map((slice, index) => {
    const bits = slice.text.split(/(\n\n|\n)/)
    return bits.map((bit, bitIndex) => {
      if (bit === "\n\n") {
        return <span className="paragraph-gap" style={{ height: document.options.paragraphSpacing }} key={`${index}-${bitIndex}`} />
      }
      if (bit === "\n") return <br key={`${index}-${bitIndex}`} />
      return (
        <span style={slice.style} key={`${index}-${bitIndex}`}>
          {bit}
        </span>
      )
    })
  })
}

function PageTextEditor({
  document,
  page,
  editing,
  onStartEditing,
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
  onFinishEditing: () => void
  onChange: (start: number, end: number, text: string) => void
  onSelectText: (selection: TextSelection) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const [draft, setDraft] = useState(page.text)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const dirty = useRef(false)

  useEffect(() => {
    if (!editing) setDraft(page.text)
  }, [editing, page.text])

  useLayoutEffect(() => {
    if (!editing) return
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    editor.setSelectionRange(editor.value.length, editor.value.length)
    onSelectText({ start: page.start + editor.value.length, end: page.start + editor.value.length })
  }, [editing, onSelectText, page.start])

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

  useEffect(() => {
    if (!editing) return
    const finishOutside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && editorRef.current?.contains(event.target)) return
      finishEditing()
    }
    window.document.addEventListener("pointerdown", finishOutside, true)
    return () => window.document.removeEventListener("pointerdown", finishOutside, true)
  }, [editing, finishEditing])

  if (editing) {
    return (
      <textarea
        ref={editorRef}
        className="page-copy page-copy-editor"
        value={draft}
        onChange={(event) => {
          if (!dirty.current) onInteractionStart()
          dirty.current = true
          setDraft(event.target.value)
        }}
        onSelect={updateSelection}
        onKeyUp={updateSelection}
        onBlur={finishEditing}
        onClick={(event) => event.stopPropagation()}
        spellCheck={false}
        aria-label="페이지 본문 편집"
      />
    )
  }

  return (
    <div
      className="page-copy page-copy-preview"
      onClick={(event) => {
        event.stopPropagation()
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
      onChange({
        x: Math.max(-current.layer.width + 3, Math.min(97, current.layer.x + dx)),
        y: Math.max(-20, Math.min(98, current.layer.y + dy)),
      })
      return
    }
    if (current.action === "resize") {
      onChange({ width: Math.max(8, Math.min(120, current.layer.width + dx)) })
      return
    }
    const centerX = current.pageRect.left + ((current.layer.x + current.layer.width / 2) / 100) * current.pageRect.width
    const centerY = current.pageRect.top + (current.layer.y / 100) * current.pageRect.height + (current.layer.width / 200) * current.pageRect.width
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
        zIndex: layer.zIndex,
        transform: `rotate(${layer.rotation}deg)`,
      }}
      onPointerDown={(event) => start(event, "move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      data-image-layer={layer.id}
    >
      <img src={layer.src} alt={layer.name} draggable={false} />
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
  profile,
  selected,
  onSelect,
  onChange,
  onDelete,
  onInteractionStart,
  onInteractionEnd,
}: {
  bubble: SpeechBubble
  profile: MemberProfile | null
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<SpeechBubble>) => void
  onDelete: () => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const session = useRef<BubblePointerSession | null>(null)
  const textEdit = useRef<{ started: boolean } | null>(null)
  const avatar = profile?.avatar ?? ""
  const speakerName = profile?.name ?? bubble.speakerName
  const bubbleColor = profile?.bubbleColor ?? bubble.bubbleColor
  const textColor = profile?.textColor ?? bubble.textColor

  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (selected && event.target instanceof Element && event.target.closest("[data-bubble-editor]")) {
      event.stopPropagation()
      onSelect()
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const page = event.currentTarget.closest<HTMLElement>("[data-book-page]")
    if (!page) return
    onSelect()
    session.current = {
      id: bubble.id,
      startX: event.clientX,
      startY: event.clientY,
      pageRect: page.getBoundingClientRect(),
      bubble,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    onInteractionStart()
  }

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = session.current
    if (!current) return
    onChange({
      x: Math.max(-8, Math.min(92, current.bubble.x + ((event.clientX - current.startX) / current.pageRect.width) * 100)),
      y: Math.max(0, Math.min(94, current.bubble.y + ((event.clientY - current.startY) / current.pageRect.height) * 100)),
    })
  }

  const end = (event: PointerEvent<HTMLDivElement>) => {
    if (!session.current) return
    session.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    onInteractionEnd()
  }

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

  const avatarNode = avatar ? <img className="speech-avatar" src={avatar} alt={`${speakerName} 프로필`} draggable={false} /> : null
  const cardNode = (
    <div className="speech-card">
      {speakerName ? <strong>{speakerName}</strong> : null}
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
      className={`speech-layer side-${bubble.side}${avatar ? " has-avatar" : " is-text-only"}${selected ? " is-selected" : ""}`}
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        width: `${bubble.width}%`,
        zIndex: bubble.zIndex,
        "--bubble-color": bubbleColor,
        "--bubble-text": textColor,
      } as CSSProperties}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      data-speech-bubble={bubble.id}
    >
      {bubble.side === "left" ? avatarNode : null}
      {cardNode}
      {bubble.side === "right" ? avatarNode : null}
      {selected ? (
        <button className="speech-delete" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onDelete} title="말풍선 삭제">
          <Trash2 aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

function DropPage({
  page,
  selected,
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
  onDeleteBubble,
  onInteractionStart,
  onInteractionEnd,
}: {
  page: number
  selected: boolean
  document: BookDocument
  children: ReactNode
  selectedImageId: string
  selectedBubbleId: string
  transformMode: boolean
  onSelectPage: () => void
  onSelectImage: (id: string) => void
  onSelectBubble: (id: string) => void
  onAddImage: (file: File) => void
  onChangeImage: (id: string, patch: Partial<ImageLayer>) => void
  onDeleteImage: (id: string) => void
  onChangeBubble: (id: string, patch: Partial<SpeechBubble>) => void
  onDeleteBubble: (id: string) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const options = document.options
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
      className={`book-page texture-${options.pageTexture}${selected ? " is-selected" : ""}`}
      style={style}
      data-book-page
      data-page-index={page}
      onClick={onSelectPage}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
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
      {document.speechBubbles
        .filter((bubble) => bubble.page === page)
        .sort((left, right) => left.zIndex - right.zIndex)
        .map((bubble) => (
          <SpeechBubbleItem
            key={bubble.id}
            bubble={bubble}
            profile={document.members.find((member) => member.id === bubble.profileId) ?? null}
            selected={bubble.id === selectedBubbleId}
            onSelect={() => onSelectBubble(bubble.id)}
            onChange={(patch) => onChangeBubble(bubble.id, patch)}
            onDelete={() => onDeleteBubble(bubble.id)}
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
          document={props.document}
          selectedImageId={props.selectedImageId}
          selectedBubbleId={props.selectedBubbleId}
          transformMode={props.transformMode}
          onSelectPage={() => props.onSelectPage(0)}
          onSelectImage={props.onSelectImage}
          onSelectBubble={props.onSelectBubble}
          onAddImage={(file) => props.onAddImage(file, 0)}
          onChangeImage={props.onChangeImage}
          onDeleteImage={props.onDeleteImage}
          onChangeBubble={props.onChangeBubble}
          onDeleteBubble={props.onDeleteBubble}
          onInteractionStart={props.onInteractionStart}
          onInteractionEnd={props.onInteractionEnd}
        >
          {coverHasImage && props.document.options.coverImage ? (
            <img className="cover-image" src={props.document.options.coverImage} alt="표지" />
          ) : null}
          {coverHasText ? (
            <div className={coverHasImage && props.document.options.coverImage ? "cover-copy is-over-image" : "cover-copy"}>
              <h1>{props.document.options.coverTitle || props.document.title}</h1>
              <p>{props.document.options.coverSubtitle}</p>
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
            document={props.document}
            selectedImageId={props.selectedImageId}
            selectedBubbleId={props.selectedBubbleId}
            transformMode={props.transformMode}
            onSelectPage={() => props.onSelectPage(pageNumber)}
            onSelectImage={props.onSelectImage}
            onSelectBubble={props.onSelectBubble}
            onAddImage={(file) => props.onAddImage(file, pageNumber)}
            onChangeImage={props.onChangeImage}
            onDeleteImage={props.onDeleteImage}
            onChangeBubble={props.onChangeBubble}
            onDeleteBubble={props.onDeleteBubble}
            onInteractionStart={props.onInteractionStart}
            onInteractionEnd={props.onInteractionEnd}
          >
            <PageTextEditor
              document={props.document}
              page={page}
              editing={editingPage === pageNumber}
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
