import { ArrowDown, ArrowUp, Check, RotateCw, Trash2 } from "lucide-react"
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, DragEvent, FocusEvent, FormEvent, MouseEvent, PointerEvent, ReactNode } from "react"
import { avatarStyle } from "../lib/avatar"
import { decoratePage } from "../lib/pagination"
import { resolveSpeechBubbleTops, speechBubbleWidth } from "../lib/speech"
import type { BookDocument, ImageLayer, MemberProfile, PageSlice, SpeechBubble, TextSelection } from "../types"

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
  onChangePageText: (start: number, end: number, text: string, followingBubbleIds: string[]) => void
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function decoratedTextHtml(document: BookDocument, start: number, end: number) {
  const page = { text: document.body.slice(start, end), start, end }
  return decoratePage(document.body, page, document.marks, document.options).map((slice) => {
    const style = [
      slice.style.color ? `color:${escapeHtml(slice.style.color)}` : "",
      slice.style.backgroundColor ? `background-color:${escapeHtml(slice.style.backgroundColor)}` : "",
      slice.style.fontStyle ? `font-style:${escapeHtml(slice.style.fontStyle)}` : "",
      slice.style.fontWeight ? `font-weight:${slice.style.fontWeight}` : "",
    ].filter(Boolean).join(";")
    const bits = slice.text.split(/(\n\n|\n)/)
    return bits.map((bit) => bit === "\n\n"
      ? `<span class="paragraph-gap" style="height:${document.options.paragraphSpacing}px"></span>`
      : bit === "\n" ? "<br>" : `<span${style ? ` style="${style}"` : ""}>${escapeHtml(bit)}</span>`).join("")
  }).join("")
}

function editableNodeText(current: Node): string {
  if (current.nodeType === Node.TEXT_NODE) return current.nodeValue ?? ""
  if (!(current instanceof Element)) return Array.from(current.childNodes).map(editableNodeText).join("")
  if (current.classList.contains("paragraph-gap")) return "\n\n"
  if (current.tagName === "BR") return "\n"
  const text = Array.from(current.childNodes).map(editableNodeText).join("")
  return /^(DIV|P|LI)$/.test(current.tagName) ? `${text}\n` : text
}

function editableElementText(editor: HTMLElement) {
  const text = Array.from(editor.childNodes).map(editableNodeText).join("").replaceAll("\u00a0", " ")
  const lastChild = editor.lastChild
  return lastChild instanceof Element && /^(DIV|P|LI)$/.test(lastChild.tagName) ? text.replace(/\n$/, "") : text
}

function selectionTextLength(editor: HTMLElement, node: Node, offset: number) {
  const range = window.document.createRange()
  range.selectNodeContents(editor)
  range.setEnd(node, offset)
  const fragment = range.cloneContents()
  return editableNodeText(fragment).replace(/\n$/, "").length
}

function FlowTextSegment({
  document,
  start,
  end,
  followingBubbleIds,
  onSelectPage,
  onChange,
  onSelectText,
  onInteractionStart,
  onInteractionEnd,
}: {
  document: BookDocument
  start: number
  end: number
  followingBubbleIds: string[]
  onSelectPage: () => void
  onChange: (start: number, end: number, text: string, followingBubbleIds: string[]) => void
  onSelectText: (selection: TextSelection) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const dirty = useRef(false)
  const preserveKeyboardSelection = useRef(false)
  const html = useMemo(() => decoratedTextHtml(document, start, end), [document, end, start])

  useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor || dirty.current || editor.innerHTML === html) return
    editor.innerHTML = html
  }, [html])

  const updateSelection = () => {
    if (preserveKeyboardSelection.current) return
    if (dirty.current) return
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection?.anchorNode || !selection.focusNode || !editor.contains(selection.anchorNode) || !editor.contains(selection.focusNode)) return
    const anchor = start + selectionTextLength(editor, selection.anchorNode, selection.anchorOffset)
    const focus = start + selectionTextLength(editor, selection.focusNode, selection.focusOffset)
    onSelectText({ start: Math.min(anchor, focus), end: Math.max(anchor, focus) })
  }

  return (
    <div
      ref={editorRef}
      className="flow-text-segment"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-flow-text-segment
      data-segment-start={start}
      onFocus={() => {
        onSelectPage()
        window.requestAnimationFrame(updateSelection)
      }}
      onPointerDown={() => {
        preserveKeyboardSelection.current = false
      }}
      onInput={() => {
        preserveKeyboardSelection.current = false
        if (!dirty.current) onInteractionStart()
        dirty.current = true
      }}
      onSelect={updateSelection}
      onMouseUp={updateSelection}
      onKeyDown={(event) => {
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "a") return
        preserveKeyboardSelection.current = true
        onSelectText({ start, end: start + editableElementText(event.currentTarget).length })
      }}
      onKeyUp={(event) => {
        if (preserveKeyboardSelection.current) {
          onSelectText({ start, end: start + editableElementText(event.currentTarget).length })
          return
        }
        updateSelection()
      }}
      onBlur={(event) => {
        updateSelection()
        if (!dirty.current) return
        dirty.current = false
        onChange(start, end, editableElementText(event.currentTarget), followingBubbleIds)
        onInteractionEnd()
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey) {
          event.currentTarget.blur()
        }
      }}
      aria-label="페이지 본문 편집"
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
  flow = false,
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
  top?: number
  flow?: boolean
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
  const messageRef = useRef<HTMLParagraphElement>(null)
  const secondaryRef = useRef<HTMLElement>(null)
  const avatar = profile?.avatar ?? ""
  const speakerName = profile?.name ?? bubble.speakerName
  const bubbleColor = profile?.bubbleColor ?? bubble.bubbleColor
  const textColor = profile?.textColor ?? bubble.textColor
  const messageHtml = escapeHtml(bubble.text).replaceAll("\n", "<br>")
  const secondaryHtml = escapeHtml(bubble.secondaryText).replaceAll("\n", "<br>")

  useLayoutEffect(() => {
    if (messageRef.current && window.document.activeElement !== messageRef.current && messageRef.current.innerHTML !== messageHtml) {
      messageRef.current.innerHTML = messageHtml
    }
    if (secondaryRef.current && window.document.activeElement !== secondaryRef.current && secondaryRef.current.innerHTML !== secondaryHtml) {
      secondaryRef.current.innerHTML = secondaryHtml
    }
  }, [messageHtml, secondaryHtml])

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
        ref={messageRef}
        contentEditable={selected}
        suppressContentEditableWarning
        data-bubble-editor
        onFocus={startTextEdit}
        onInput={changeTextEdit}
        onBlur={(event) => finishTextEdit("text", event)}
        dangerouslySetInnerHTML={{ __html: messageHtml }}
      />
      <small
        ref={secondaryRef}
        contentEditable={selected}
        suppressContentEditableWarning
        data-bubble-editor
        data-placeholder="보조 문장"
        onFocus={startTextEdit}
        onInput={changeTextEdit}
        onBlur={(event) => finishTextEdit("secondaryText", event)}
        dangerouslySetInnerHTML={{ __html: secondaryHtml }}
      />
    </div>
  )

  return (
    <div
      className={`speech-layer side-${bubble.side}${flow ? " is-flow" : ""}${avatar ? " has-avatar" : " is-text-only"}${selected ? " is-selected" : ""}${!flow && bubble.y < 8 ? " is-near-top" : ""}`}
      style={{
        left: flow ? undefined : bubble.side === "left" ? "8%" : "auto",
        right: flow ? undefined : bubble.side === "right" ? "8%" : "auto",
        top: flow ? undefined : `${top ?? bubble.y}%`,
        width: `${bubble.autoWidth === false ? bubble.width : speechBubbleWidth(bubble, speakerName, Boolean(avatar))}%`,
        zIndex: bubble.zIndex + 10,
        "--bubble-color": bubbleColor,
        "--bubble-text": textColor,
        "--bubble-message-size": `${2.9 * ((bubble.textScale ?? 100) / 100)}cqw`,
        "--bubble-secondary-size": `${2.1 * ((bubble.secondaryTextScale ?? 100) / 100)}cqw`,
      } as CSSProperties}
      onPointerDown={(event) => {
        event.stopPropagation()
        if (flow && window.document.activeElement instanceof HTMLElement && window.document.activeElement.matches("[data-flow-text-segment]")) {
          window.document.activeElement.blur()
        }
        onSelect()
      }}
      data-speech-bubble={bubble.id}
      data-flow-bubble={flow ? bubble.id : undefined}
      data-dialogue-layout-id={flow ? undefined : `bubble:${bubble.id}`}
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

function PageFlowEditor({
  document,
  page,
  bubbles,
  selectedBubbleId,
  onSelectPage,
  onSelectBubble,
  onChangeBubble,
  onMoveBubble,
  onDeleteBubble,
  onChangePageText,
  onSelectText,
  onInteractionStart,
  onInteractionEnd,
}: {
  document: BookDocument
  page: PageSlice
  bubbles: SpeechBubble[]
  selectedBubbleId: string
  onSelectPage: () => void
  onSelectBubble: (id: string) => void
  onChangeBubble: (id: string, patch: Partial<SpeechBubble>) => void
  onMoveBubble: (id: string, direction: -1 | 1) => void
  onDeleteBubble: (id: string) => void
  onChangePageText: Props["onChangePageText"]
  onSelectText: (selection: TextSelection) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const ordered = [...bubbles].sort((left, right) => left.anchor - right.anchor || left.zIndex - right.zIndex)
  const globalOrder = document.speechBubbles
    .filter((bubble) => bubble.page > 0)
    .sort((left, right) => left.anchor - right.anchor || left.zIndex - right.zIndex)
  const nodes: ReactNode[] = []
  let cursor = page.start

  ordered.forEach((bubble) => {
    const anchor = Math.max(cursor, Math.min(page.end, bubble.anchor))
    nodes.push(
      <FlowTextSegment
        key={`text:${cursor}:${bubble.id}`}
        document={document}
        start={cursor}
        end={anchor}
        followingBubbleIds={globalOrder.slice(globalOrder.findIndex((item) => item.id === bubble.id)).map((item) => item.id)}
        onSelectPage={onSelectPage}
        onChange={onChangePageText}
        onSelectText={onSelectText}
        onInteractionStart={onInteractionStart}
        onInteractionEnd={onInteractionEnd}
      />,
      <SpeechBubbleItem
        key={`bubble:${bubble.id}`}
        bubble={bubble}
        flow
        profile={document.members.find((member) => member.id === bubble.profileId) ?? null}
        selected={bubble.id === selectedBubbleId}
        onSelect={() => onSelectBubble(bubble.id)}
        onChange={(patch) => onChangeBubble(bubble.id, patch)}
        onMove={(direction) => onMoveBubble(bubble.id, direction)}
        onDelete={() => onDeleteBubble(bubble.id)}
        onInteractionStart={onInteractionStart}
        onInteractionEnd={onInteractionEnd}
      />,
    )
    cursor = anchor
  })

  nodes.push(
    <FlowTextSegment
      key={`text:${cursor}:end`}
      document={document}
      start={cursor}
      end={page.end}
      followingBubbleIds={(ordered.length
        ? globalOrder.slice(globalOrder.findIndex((item) => item.id === ordered.at(-1)?.id) + 1)
        : globalOrder.filter((bubble) => bubble.anchor >= page.end)
      ).map((item) => item.id)}
      onSelectPage={onSelectPage}
      onChange={onChangePageText}
      onSelectText={onSelectText}
      onInteractionStart={onInteractionStart}
      onInteractionEnd={onInteractionEnd}
    />,
  )

  return <div className="page-copy page-flow" title="본문 편집">{nodes}</div>
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
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const pageRef = useRef<HTMLElement>(null)
  const [layoutTops, setLayoutTops] = useState<Record<string, number>>({})
  const options = document.options
  const pageBubbles = useMemo(() => document.speechBubbles
    .filter((bubble) => page === 0 && bubble.page === 0)
    .sort((left, right) => left.y - right.y || left.zIndex - right.zIndex), [document.speechBubbles, page])
  const measureSpeechBubbles = useCallback(() => {
    const pageElement = pageRef.current
    if (!pageElement?.clientHeight) return
    const elements = Array.from(pageElement.querySelectorAll<HTMLElement>("[data-dialogue-layout-id]"))
    const heights = new Map(elements.map((element) => [element.dataset.speechBubble ?? "", (element.getBoundingClientRect().height / pageElement.clientHeight) * 100]))
    const next = resolveSpeechBubbleTops(pageBubbles.map((bubble) => ({
      id: bubble.id,
      y: bubble.y,
      zIndex: bubble.zIndex,
      height: heights.get(bubble.id) ?? 0,
    })))
    setLayoutTops((current) => {
      const ids = Object.keys(next)
      const unchanged = ids.length === Object.keys(current).length
        && ids.every((id) => Math.abs((current[id] ?? -100) - next[id]) < 0.05)
      return unchanged ? current : next
    })
  }, [pageBubbles])

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
      {pageBubbles.map((bubble) => (
          <SpeechBubbleItem
            key={bubble.id}
            bubble={bubble}
            top={layoutTops[bubble.id] ?? bubble.y}
            profile={document.members.find((member) => member.id === bubble.profileId) ?? null}
            selected={bubble.id === selectedBubbleId}
            onSelect={() => onSelectBubble(bubble.id)}
            onChange={(patch) => onChangeBubble(bubble.id, patch)}
            onMove={(direction) => onMoveBubble(bubble.id, direction)}
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
            onInteractionStart={props.onInteractionStart}
            onInteractionEnd={props.onInteractionEnd}
          >
            <PageFlowEditor
              document={props.document}
              page={page}
              bubbles={props.document.speechBubbles.filter((bubble) => (
                bubble.page > 0
                && (page.blockIds
                  ? page.blockIds.includes(bubble.id)
                  : bubble.anchor >= page.start && (bubble.anchor < page.end || index === props.pages.length - 1))
              ))}
              selectedBubbleId={props.selectedBubbleId}
              onSelectPage={() => props.onSelectPage(pageNumber)}
              onSelectBubble={props.onSelectBubble}
              onChangeBubble={props.onChangeBubble}
              onMoveBubble={props.onMoveBubble}
              onDeleteBubble={props.onDeleteBubble}
              onChangePageText={props.onChangePageText}
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
