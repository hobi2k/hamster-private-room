import { ArrowDown, ArrowLeftRight, ArrowUp, Check, RotateCw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { ClipboardEvent, CSSProperties, DragEvent, FocusEvent, FormEvent, MouseEvent, PointerEvent, ReactNode } from "react"
import { avatarStyle } from "../lib/avatar"
import { decoratePage } from "../lib/pagination"
import { resolveSpeechBubbleTops, speechBubbleWidth } from "../lib/speech"
import { diffRange, segmentOwnsCaret } from "../lib/text"
import type { BookDocument, DividerBlock, ImageLayer, MemberProfile, PageSlice, SpeechBubble, TextSelection } from "../types"

type Props = {
  document: BookDocument
  pages: PageSlice[]
  selectedPage: number
  selectedPages: number[]
  selectedImageId: string
  selectedBubbleId: string
  selectedDividerId: string
  pendingCaret: { offset: number; beforeBlockId: string | null } | null
  transformMode: boolean
  onSelectPage: (page: number, additive?: boolean) => void
  onSelectImage: (id: string) => void
  onSelectBubble: (id: string) => void
  onSelectDivider: (id: string) => void
  onAddImage: (file: File, page: number) => void
  onChangeImage: (id: string, patch: Partial<ImageLayer>) => void
  onDeleteImage: (id: string) => void
  onChangeBubble: (id: string, patch: Partial<SpeechBubble>) => void
  onMoveBubble: (id: string, direction: -1 | 1) => void
  onDeleteBubble: (id: string) => void
  onMeasureBubbles: (heights: Record<string, number>) => void
  onDeleteDivider: (id: string) => void
  onChangePageText: (
    start: number,
    end: number,
    text: string,
    followingBlockIds: string[],
    caret?: { offset: number; beforeBlockId: string | null },
  ) => void
  onCaretRestored: () => void
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
  const html = decoratePage(document.body, page, document.marks, document.options).map((slice) => {
    const style = [
      slice.style.color ? `color:${escapeHtml(slice.style.color)}` : "",
      slice.style.backgroundColor ? `background-color:${escapeHtml(slice.style.backgroundColor)}` : "",
      slice.style.fontStyle ? `font-style:${escapeHtml(slice.style.fontStyle)}` : "",
      slice.style.fontWeight ? `font-weight:${slice.style.fontWeight}` : "",
      slice.style.fontFamily ? `font-family:'${escapeHtml(slice.style.fontFamily.replace(/["'\\]/g, ""))}', 'Noto Serif KR', serif` : "",
    ].filter(Boolean).join(";")
    const bits = slice.text.split(/(\n\n|\n)/)
    return bits.map((bit) => bit === "\n\n"
      ? `<span class="paragraph-gap" style="height:${document.options.paragraphSpacing}px"></span>`
      : bit === "\n" ? "<br>" : `<span${style ? ` style="${style}"` : ""}>${escapeHtml(bit)}</span>`).join("")
  }).join("")
  return page.text.endsWith("\n") ? `${html}<span class="caret-anchor">&#8203;</span>` : html
}

function editableNodeText(current: Node): string {
  if (current.nodeType === Node.TEXT_NODE) return current.nodeValue ?? ""
  if (!(current instanceof Element)) return Array.from(current.childNodes).map(editableNodeText).join("")
  if (current.classList.contains("caret-anchor")) {
    return Array.from(current.childNodes).map(editableNodeText).join("").replaceAll("\u200b", "")
  }
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
  return editableNodeText(fragment).length
}

function caretTextLength(editor: HTMLElement) {
  const selection = window.getSelection()
  if (!selection?.focusNode || !editor.contains(selection.focusNode)) return editableElementText(editor).length
  return selectionTextLength(editor, selection.focusNode, selection.focusOffset)
}

function placeCaret(editor: HTMLElement, offset: number) {
  const range = window.document.createRange()
  let remaining = Math.max(0, offset)
  let placed = false

  const visit = (node: Node) => {
    if (placed) return
    if (node.nodeType === Node.TEXT_NODE) {
      const length = node.nodeValue?.length ?? 0
      if (remaining <= length) {
        range.setStart(node, remaining)
        placed = true
        return
      }
      remaining -= length
      return
    }
    if (!(node instanceof Element)) {
      Array.from(node.childNodes).forEach(visit)
      return
    }
    if (node.classList.contains("caret-anchor")) {
      const textNodes = Array.from(node.childNodes).filter((child) => child.nodeType === Node.TEXT_NODE)
      for (const textNode of textNodes) {
        const raw = textNode.nodeValue ?? ""
        const logicalLength = raw.replaceAll("\u200b", "").length
        if (remaining <= logicalLength) {
          let logicalOffset = 0
          let rawOffset = raw.length
          for (let index = 0; index < raw.length; index += 1) {
            if (raw[index] === "\u200b") continue
            if (logicalOffset === remaining) {
              rawOffset = index
              break
            }
            logicalOffset += 1
          }
          range.setStart(textNode, rawOffset)
          placed = true
          return
        }
        remaining -= logicalLength
      }
      return
    }
    const virtualLength = node.classList.contains("paragraph-gap") ? 2 : node.tagName === "BR" ? 1 : 0
    if (virtualLength) {
      if (remaining <= virtualLength) {
        const anchorText = node.nextSibling instanceof Element && node.nextSibling.classList.contains("caret-anchor")
          ? node.nextSibling.firstChild
          : null
        if (anchorText?.nodeType === Node.TEXT_NODE) range.setStart(anchorText, 1)
        else range.setStartAfter(node)
        placed = true
        return
      }
      remaining -= virtualLength
      return
    }
    Array.from(node.childNodes).forEach(visit)
  }

  Array.from(editor.childNodes).forEach(visit)
  if (!placed) {
    range.selectNodeContents(editor)
    range.collapse(false)
  } else {
    range.collapse(true)
  }
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function replaceSelectionWithText(editor: HTMLElement, text: string) {
  const selection = window.getSelection()
  const range = selection?.rangeCount ? selection.getRangeAt(0) : window.document.createRange()
  if (!selection || !editor.contains(range.commonAncestorContainer)) {
    range.selectNodeContents(editor)
    range.collapse(false)
  }
  range.deleteContents()
  const nodes = text.split("\n").flatMap<Node>((line, index, lines) => {
    if (index === lines.length - 1) return line ? [window.document.createTextNode(line)] : []
    const anchor = window.document.createElement("span")
    anchor.className = "caret-anchor"
    anchor.textContent = "\u200b"
    return [
      ...(line ? [window.document.createTextNode(line)] : []),
      window.document.createElement("br"),
      anchor,
    ]
  })
  if (!nodes.length) return
  const fragment = window.document.createDocumentFragment()
  nodes.forEach((node) => fragment.append(node))
  range.insertNode(fragment)
  const lastNode = nodes.at(-1)!
  const anchorText = lastNode instanceof Element && lastNode.classList.contains("caret-anchor")
    ? lastNode.firstChild
    : null
  if (anchorText?.nodeType === Node.TEXT_NODE) range.setStart(anchorText, 1)
  else range.setStartAfter(lastNode)
  range.collapse(true)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function FlowTextSegment({
  document,
  start,
  end,
  isGap = false,
  align,
  suppressLeadBreak = false,
  suppressTrailBreak = false,
  leadingSegment = true,
  followingBlockIds,
  pendingCaret,
  onSelectPage,
  onChange,
  onCaretRestored,
  onSelectText,
  onInteractionStart,
  onInteractionEnd,
}: {
  document: BookDocument
  start: number
  end: number
  isGap?: boolean
  align?: CSSProperties["textAlign"]
  suppressLeadBreak?: boolean
  suppressTrailBreak?: boolean
  leadingSegment?: boolean
  followingBlockIds: string[]
  pendingCaret: Props["pendingCaret"]
  onSelectPage: () => void
  onChange: Props["onChangePageText"]
  onCaretRestored: () => void
  onSelectText: (selection: TextSelection) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const dirty = useRef(false)
  const editEnd = useRef(end)
  const lastText = useRef("")
  const preserveKeyboardSelection = useRef(false)
  const composing = useRef(false)
  const html = useMemo(() => decoratedTextHtml(document, start, end), [document, end, start])
  const beforeBlockId = followingBlockIds[0] ?? null

  useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor || editor.innerHTML === html) return
    const editingHere = dirty.current && window.document.activeElement === editor
    if (editingHere) {
      // Never clobber an active IME (Korean) composition.
      if (composing.current) return
      // Keep the user's live edits — UNLESS the text reflowed across the page
      // boundary so this segment's DOM no longer matches its body range. Without
      // this resync the reflowed tail renders duplicated on both pages.
      if (editableElementText(editor) === document.body.slice(start, end)) return
    }
    editor.innerHTML = html
    if (editingHere) {
      // Realign the edit trackers to the freshly-synced content; the pendingCaret
      // effect (which runs right after this one) restores the caret.
      lastText.current = document.body.slice(start, end)
      editEnd.current = end
    }
  }, [html])

  useLayoutEffect(() => {
    if (!dirty.current) editEnd.current = end
  }, [end])

  useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor || !pendingCaret || pendingCaret.beforeBlockId !== beforeBlockId) return
    // Alignment can split one text run into adjacent editors with the same
    // beforeBlockId. At their shared boundary only the leading segment owns the
    // exact offset, preventing both effects from racing to restore the caret.
    if (!segmentOwnsCaret(start, end, pendingCaret.offset, leadingSegment)) return
    editor.focus({ preventScroll: true })
    placeCaret(editor, pendingCaret.offset - start)
    onSelectText({ start: pendingCaret.offset, end: pendingCaret.offset })
    editor.scrollIntoView({ block: "nearest" })
    queueMicrotask(onCaretRestored)
  }, [beforeBlockId, end, leadingSegment, onCaretRestored, onSelectText, pendingCaret, start])

  useEffect(() => () => {
    if (dirty.current) onInteractionEnd()
  }, [onInteractionEnd])

  const updateSelection = () => {
    if (preserveKeyboardSelection.current) return
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection?.anchorNode || !selection.focusNode || !editor.contains(selection.anchorNode) || !editor.contains(selection.focusNode)) return
    const anchor = start + selectionTextLength(editor, selection.anchorNode, selection.anchorOffset)
    const focus = start + selectionTextLength(editor, selection.focusNode, selection.focusOffset)
    onSelectText({ start: Math.min(anchor, focus), end: Math.max(anchor, focus) })
  }

  const applyEditorChange = (editor: HTMLDivElement) => {
    preserveKeyboardSelection.current = false
    // Re-arm the transient on every change. beginTransient is idempotent (it no-ops
    // while a transient is open), but if a mid-typing toolbar commit (bold/italic/…
    // applied without blurring) already flushed the open transient, this snapshots
    // the post-commit state so the resumed typing burst still earns its own undo
    // entry — otherwise a later undo overshoots past the intervening mark.
    onInteractionStart()
    if (!dirty.current) {
      editEnd.current = end
      lastText.current = document.body.slice(start, end)
    }
    dirty.current = true
    const text = editableElementText(editor)
    const caret = start + caretTextLength(editor)
    // Replace only the span that actually changed (common prefix/suffix diff) so
    // text marks and neighbouring blocks outside the edit are preserved, not
    // wiped by a whole-segment rewrite on every keystroke.
    const { prefix, suffix } = diffRange(lastText.current, text)
    onChange(start + prefix, editEnd.current - suffix, text.slice(prefix, text.length - suffix), followingBlockIds, {
      offset: caret,
      beforeBlockId,
    })
    editEnd.current = start + text.length
    lastText.current = text
  }

  const applyCut = (event: ClipboardEvent<HTMLDivElement>) => {
    const editor = event.currentTarget
    const value = editableElementText(editor)
    const selection = window.getSelection()
    const hasNativeSelection = Boolean(
      selection?.anchorNode
      && selection.focusNode
      && editor.contains(selection.anchorNode)
      && editor.contains(selection.focusNode)
      && !selection.isCollapsed,
    )
    const anchor = hasNativeSelection && selection?.anchorNode
      ? selectionTextLength(editor, selection.anchorNode, selection.anchorOffset)
      : 0
    const focus = hasNativeSelection && selection?.focusNode
      ? selectionTextLength(editor, selection.focusNode, selection.focusOffset)
      : preserveKeyboardSelection.current ? value.length : 0
    const cutStart = Math.min(anchor, focus)
    const cutEnd = Math.max(anchor, focus)
    if (cutStart === cutEnd) return

    event.preventDefault()
    event.clipboardData.setData("text/plain", value.slice(cutStart, cutEnd))
    // Re-arm the transient (see applyEditorChange) so a cut after a no-blur toolbar
    // commit is recorded as its own undo step instead of being folded into the mark.
    onInteractionStart()
    if (!dirty.current) {
      editEnd.current = end
    }
    dirty.current = true
    preserveKeyboardSelection.current = false
    const next = `${value.slice(0, cutStart)}${value.slice(cutEnd)}`
    if (hasNativeSelection) selection?.deleteFromDocument()
    else editor.textContent = next
    onSelectText({ start: start + cutStart, end: start + cutStart })
    // Only the cut span is removed, so marks/blocks outside it are preserved.
    onChange(start + cutStart, start + cutEnd, "", followingBlockIds, {
      offset: start + cutStart,
      beforeBlockId,
    })
    editEnd.current = start + next.length
    lastText.current = next
  }

  return (
    <div
      ref={editorRef}
      className={`flow-text-segment${isGap ? " is-gap" : ""}${suppressLeadBreak ? " no-lead-break" : ""}${suppressTrailBreak ? " no-trail-break" : ""}`}
      style={align ? { textAlign: align } : undefined}
      contentEditable="plaintext-only"
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
      onCompositionStart={() => {
        composing.current = true
      }}
      onCompositionEnd={(event) => {
        composing.current = false
        applyEditorChange(event.currentTarget)
      }}
      onInput={(event) => {
        if (!composing.current) applyEditorChange(event.currentTarget)
      }}
      onPaste={(event) => {
        event.preventDefault()
        // Strip form-feed: it is the internal page-break sentinel, so pasted \f
        // would silently split the page and shove trailing text out of view.
        replaceSelectionWithText(event.currentTarget, event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n").replace(/\f/g, ""))
        applyEditorChange(event.currentTarget)
      }}
      onCut={applyCut}
      onSelect={updateSelection}
      onMouseUp={updateSelection}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !(event.nativeEvent as KeyboardEvent).isComposing) {
          event.preventDefault()
          replaceSelectionWithText(event.currentTarget, "\n")
          applyEditorChange(event.currentTarget)
          return
        }
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
        editEnd.current = end
        if (event.currentTarget.innerHTML !== html) event.currentTarget.innerHTML = html
        onInteractionEnd()
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey) {
          event.currentTarget.blur()
        }
      }}
      aria-label="페이지 본문 편집"
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
    // Half-height must use aspectRatio to match move()'s pivot, otherwise the
    // rotation snaps the instant the handle is grabbed.
    const centerY = pageRect.top + (layer.y / 100) * pageRect.height + (layer.width / (200 * (layer.aspectRatio ?? 1))) * pageRect.width
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
      const radians = (current.layer.rotation * Math.PI) / 180
      const pointerDx = event.clientX - current.startX
      const pointerDy = event.clientY - current.startY
      // Undo the layer rotation, then project the local pointer movement onto
      // the bottom-right resize handle's diagonal. This keeps the handle under
      // the pointer for both landscape and portrait images at any rotation.
      const localX = pointerDx * Math.cos(radians) + pointerDy * Math.sin(radians)
      const localY = -pointerDx * Math.sin(radians) + pointerDy * Math.cos(radians)
      const inverseAspect = 1 / Math.max(0.1, current.layer.aspectRatio ?? 1)
      const widthDelta = ((localX + localY * inverseAspect) / (1 + inverseAspect ** 2) / current.pageRect.width) * 100
      onChange({ width: Math.max(8, Math.min(500, current.layer.width + widthDelta)) })
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
        // Width is a share of the full page. In flow the layer lives inside the
        // narrower text column, so `%` would resolve against the wrong box and
        // clip un-wrappable text — use cqw (relative to .book-page) to match the
        // avatar/padding units and estimateSpeechBubbleHeight's page-width basis.
        width: `${bubble.autoWidth === false ? bubble.width : speechBubbleWidth(bubble, speakerName, Boolean(avatar))}cqw`,
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
          <button
            type="button"
            onClick={() => {
              // Bracket this one-shot transient patch so it is recorded in
              // history (otherwise the side-swap is not undoable).
              onInteractionStart()
              onChange({ side: bubble.side === "left" ? "right" : "left" })
              onInteractionEnd()
            }}
            title="말풍선 좌우 바꾸기"
            aria-label="말풍선 좌우 바꾸기"
          >
            <ArrowLeftRight aria-hidden="true" />
          </button>
          <button className="speech-delete" type="button" onClick={onDelete} title="말풍선 삭제" aria-label="말풍선 삭제">
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

function FlowDividerItem({
  divider,
  selected,
  onSelect,
  onDelete,
}: {
  divider: DividerBlock
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`flow-divider style-${divider.style}${selected ? " is-selected" : ""}`}
      style={{ "--divider-color": divider.color } as CSSProperties}
      contentEditable={false}
      data-flow-divider={divider.id}
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (window.document.activeElement instanceof HTMLElement) window.document.activeElement.blur()
        onSelect()
      }}
    >
      <span className="divider-line" />
      {divider.style === "diamond" ? <span className="divider-motif" aria-hidden="true">◆ ◆ ◆</span> : null}
      {divider.style === "dots" ? <span className="divider-motif is-dots" aria-hidden="true">● ● ●</span> : null}
      {divider.style === "diamond" || divider.style === "dots" ? <span className="divider-line" /> : null}
      {selected ? (
        <button className="divider-delete" type="button" onClick={onDelete} title="구분선 삭제" aria-label="구분선 삭제">
          <Trash2 aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

function PageFlowEditor({
  document,
  page,
  bubbles,
  dividers,
  selectedBubbleId,
  selectedDividerId,
  pendingCaret,
  onSelectPage,
  onSelectBubble,
  onSelectDivider,
  onChangeBubble,
  onMoveBubble,
  onDeleteBubble,
  onDeleteDivider,
  onChangePageText,
  onCaretRestored,
  onSelectText,
  onInteractionStart,
  onInteractionEnd,
}: {
  document: BookDocument
  page: PageSlice
  bubbles: SpeechBubble[]
  dividers: DividerBlock[]
  selectedBubbleId: string
  selectedDividerId: string
  pendingCaret: Props["pendingCaret"]
  onSelectPage: () => void
  onSelectBubble: (id: string) => void
  onSelectDivider: (id: string) => void
  onChangeBubble: (id: string, patch: Partial<SpeechBubble>) => void
  onMoveBubble: (id: string, direction: -1 | 1) => void
  onDeleteBubble: (id: string) => void
  onDeleteDivider: (id: string) => void
  onChangePageText: Props["onChangePageText"]
  onCaretRestored: () => void
  onSelectText: (selection: TextSelection) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  // Same-anchor ties default to bubbles (rank 0) before dividers (rank 1),
  // matching App.documentFlowBlocks. A bubble moved across a divider adopts
  // rank 1 so its zIndex can place it directly between divider order values.
  const ordered = [
    ...bubbles.map((bubble) => ({ id: bubble.id, anchor: bubble.anchor, order: bubble.zIndex, rank: bubble.flowRank ?? 0, type: "bubble" as const, bubble })),
    ...dividers.map((divider) => ({ id: divider.id, anchor: divider.anchor, order: divider.order, rank: 1, type: "divider" as const, divider })),
  ].sort((left, right) => left.anchor - right.anchor || left.rank - right.rank || left.order - right.order)
  const globalOrder = [
    ...document.speechBubbles.filter((bubble) => bubble.page > 0).map((bubble) => ({ id: bubble.id, anchor: bubble.anchor, order: bubble.zIndex, rank: bubble.flowRank ?? 0 })),
    ...document.dividers.map((divider) => ({ id: divider.id, anchor: divider.anchor, order: divider.order, rank: 1 })),
  ].sort((left, right) => left.anchor - right.anchor || left.rank - right.rank || left.order - right.order)
  // Paragraph alignment lives in "align" marks. A text run is split into
  // sub-segments wherever the alignment changes, and each editable div gets its
  // own text-align. The caret/offset model inside each segment is untouched, so
  // this adds no risk to editing; with no align marks the output is identical to
  // a single un-split run.
  // Snap each align mark to the WHOLE paragraph(s) it touches, so a mark whose
  // range has drifted off the exact \n boundaries (after edits) still aligns
  // complete lines instead of splitting a paragraph mid-line into stacked divs.
  const paraStartOf = (pos: number) => document.body.lastIndexOf("\n", pos - 1) + 1
  const paraEndOf = (pos: number) => {
    const nl = document.body.indexOf("\n", pos)
    return nl === -1 ? document.body.length : nl
  }
  const alignRegions = document.marks
    .filter((mark) => mark.kind === "align")
    .map((mark) => ({
      start: paraStartOf(mark.start),
      end: paraEndOf(Math.max(mark.start, mark.end - 1)),
      value: mark.value as CSSProperties["textAlign"],
    }))
  const alignFor = (from: number, to: number) =>
    alignRegions.find((region) => region.start <= from && region.end >= to)?.value
  const nodes: ReactNode[] = []
  let cursor = page.start

  const pushRun = (from: number, to: number, followingBlockIds: string[], keyId: string, isGap: boolean) => {
    const bounds = new Set([from, to])
    alignRegions.forEach((region) => {
      if (region.start > from && region.start < to) bounds.add(region.start)
      if (region.end > from && region.end < to) bounds.add(region.end)
    })
    const points = [...bounds].sort((left, right) => left - right)
    const pairs = points.length > 1 ? points.slice(0, -1).map((value, index) => [value, points[index + 1]] as const) : [[from, to] as const]
    pairs.forEach(([segStart, segEnd], index) => {
      nodes.push(
        <FlowTextSegment
          key={`text:${segStart}:${keyId}${index ? `:${index}` : ""}`}
          document={document}
          start={segStart}
          end={segEnd}
          isGap={isGap && index === 0}
          align={alignFor(segStart, segEnd)}
          suppressLeadBreak={index > 0}
          suppressTrailBreak={index < pairs.length - 1}
          leadingSegment={index === 0}
          followingBlockIds={followingBlockIds}
          pendingCaret={pendingCaret}
          onSelectPage={onSelectPage}
          onChange={onChangePageText}
          onCaretRestored={onCaretRestored}
          onSelectText={onSelectText}
          onInteractionStart={onInteractionStart}
          onInteractionEnd={onInteractionEnd}
        />,
      )
    })
  }

  ordered.forEach((item, index) => {
    const anchor = Math.max(cursor, Math.min(page.end, item.anchor))
    pushRun(
      cursor,
      anchor,
      globalOrder.slice(globalOrder.findIndex((block) => block.id === item.id)).map((block) => block.id),
      item.id,
      index > 0,
    )
    nodes.push(item.type === "bubble" ? (
      <SpeechBubbleItem
        key={`bubble:${item.id}`}
        bubble={item.bubble}
        flow
        profile={document.members.find((member) => member.id === item.bubble.profileId) ?? null}
        selected={item.id === selectedBubbleId}
        onSelect={() => onSelectBubble(item.id)}
        onChange={(patch) => onChangeBubble(item.id, patch)}
        onMove={(direction) => onMoveBubble(item.id, direction)}
        onDelete={() => onDeleteBubble(item.id)}
        onInteractionStart={onInteractionStart}
        onInteractionEnd={onInteractionEnd}
      />
    ) : (
      <FlowDividerItem
        key={`divider:${item.id}`}
        divider={item.divider}
        selected={item.id === selectedDividerId}
        onSelect={() => onSelectDivider(item.id)}
        onDelete={() => onDeleteDivider(item.id)}
      />
    ))
    cursor = anchor
  })

  pushRun(
    cursor,
    page.end,
    (ordered.length
      ? globalOrder.slice(globalOrder.findIndex((item) => item.id === ordered.at(-1)?.id) + 1)
      : globalOrder.filter((block) => block.anchor >= page.end)
    ).map((item) => item.id),
    "end",
    false,
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
  onMeasureBubbles,
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
  onMeasureBubbles: (heights: Record<string, number>) => void
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

  // Report each flow bubble's real occupied height (in page-width px) so
  // pagination reserves exactly what it takes. Skip the selected bubble because
  // selection can change its width/height and would cause a page reflow on
  // select/deselect.
  const measureFlowBubbles = useCallback(() => {
    const pageElement = pageRef.current
    if (!pageElement?.clientWidth) return
    const measured: Record<string, number> = {}
    pageElement.querySelectorAll<HTMLElement>("[data-flow-bubble]").forEach((element) => {
      const id = element.dataset.flowBubble
      if (!id || id === selectedBubbleId) return
      const cs = window.getComputedStyle(element)
      const occupied = element.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)
      measured[id] = (occupied / pageElement.clientWidth) * options.pageWidth
    })
    if (Object.keys(measured).length) onMeasureBubbles(measured)
  }, [onMeasureBubbles, options.pageWidth, selectedBubbleId])

  useLayoutEffect(() => {
    const pageElement = pageRef.current
    if (!pageElement) return
    const measure = () => {
      measureSpeechBubbles()
      measureFlowBubbles()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(pageElement)
    pageElement.querySelectorAll<HTMLElement>("[data-dialogue-layout-id], [data-flow-bubble]").forEach((element) => observer.observe(element))
    let cancelled = false
    void window.document.fonts.ready.then(() => {
      if (!cancelled) measure()
    })
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [document.members, measureFlowBubbles, measureSpeechBubbles, selectedBubbleId])

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
  const pendingCaretPage = props.pendingCaret
    ? props.pages.findIndex((page, index) => props.pendingCaret
      && props.pendingCaret.offset >= page.start
      && (
        props.pendingCaret.offset < page.end
        || (index === props.pages.length - 1 && props.pendingCaret.offset <= page.end)
        || (props.pendingCaret.offset === page.end && (props.pages[index + 1]?.start ?? page.end) > page.end)
      ))
    : -1

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
          onMeasureBubbles={props.onMeasureBubbles}
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
            onMeasureBubbles={props.onMeasureBubbles}
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
              dividers={props.document.dividers.filter((divider) => page.blockIds?.includes(divider.id))}
              selectedBubbleId={props.selectedBubbleId}
              selectedDividerId={props.selectedDividerId}
              pendingCaret={pendingCaretPage === index ? props.pendingCaret : null}
              onSelectPage={() => props.onSelectPage(pageNumber)}
              onSelectBubble={props.onSelectBubble}
              onSelectDivider={props.onSelectDivider}
              onChangeBubble={props.onChangeBubble}
              onMoveBubble={props.onMoveBubble}
              onDeleteBubble={props.onDeleteBubble}
              onDeleteDivider={props.onDeleteDivider}
              onChangePageText={props.onChangePageText}
              onCaretRestored={props.onCaretRestored}
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
