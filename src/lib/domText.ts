import type { TextSelection } from "../types"

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

export function editableElementText(editor: HTMLElement) {
  const text = Array.from(editor.childNodes).map(editableNodeText).join("").replaceAll("\u00a0", " ")
  const lastChild = editor.lastChild
  return lastChild instanceof Element && /^(DIV|P|LI)$/.test(lastChild.tagName) ? text.replace(/\n$/, "") : text
}

export function selectionTextLength(editor: HTMLElement, node: Node, offset: number) {
  const range = window.document.createRange()
  range.selectNodeContents(editor)
  range.setEnd(node, offset)
  return editableNodeText(range.cloneContents()).length
}

function editablePointAt(editor: HTMLElement, requestedOffset: number) {
  let remaining = Math.max(0, Math.min(editableElementText(editor).length, requestedOffset))

  const visit = (parent: Node): { node: Node; offset: number } | null => {
    const children = Array.from(parent.childNodes)
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index]
      if (child.nodeType === Node.TEXT_NODE) {
        const raw = child.nodeValue ?? ""
        const caretAnchor = child.parentElement?.closest(".caret-anchor")
        const logical = caretAnchor ? raw.replaceAll("\u200b", "") : raw
        if (remaining <= logical.length) {
          if (!caretAnchor) return { node: child, offset: remaining }
          let logicalOffset = 0
          let rawOffset = 0
          while (rawOffset < raw.length && logicalOffset < remaining) {
            if (raw[rawOffset] !== "\u200b") logicalOffset += 1
            rawOffset += 1
          }
          return { node: child, offset: rawOffset }
        }
        remaining -= logical.length
        continue
      }
      if (!(child instanceof Element)) {
        const point = visit(child)
        if (point) return point
        continue
      }
      const virtualLength = child.classList.contains("paragraph-gap") ? 2 : child.tagName === "BR" ? 1 : 0
      if (virtualLength) {
        if (remaining === 0) return { node: parent, offset: index }
        if (remaining <= virtualLength) {
          const anchor = children[index + 1]
          return {
            node: parent,
            offset: anchor instanceof Element && anchor.classList.contains("caret-anchor") ? index + 2 : index + 1,
          }
        }
        remaining -= virtualLength
        continue
      }
      const point = visit(child)
      if (point) return point
    }
    return null
  }

  return visit(editor) ?? { node: editor, offset: editor.childNodes.length }
}

export function restoreEditableSelection(editor: HTMLElement, start: number, end: number) {
  const range = window.document.createRange()
  const first = editablePointAt(editor, Math.min(start, end))
  const last = editablePointAt(editor, Math.max(start, end))
  range.setStart(first.node, first.offset)
  range.setEnd(last.node, last.offset)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function flowEditorForNode(node: Node) {
  const element = node instanceof Element ? node : node.parentElement
  return element?.closest<HTMLElement>("[data-flow-text-segment]") ?? null
}

export function readFlowTextSelection(selection = window.getSelection()): TextSelection | null {
  if (!selection?.anchorNode || !selection.focusNode) return null
  const anchorEditor = flowEditorForNode(selection.anchorNode)
  const focusEditor = flowEditorForNode(selection.focusNode)
  if (!anchorEditor || !focusEditor) return null
  const anchorStart = Number(anchorEditor.dataset.segmentStart)
  const focusStart = Number(focusEditor.dataset.segmentStart)
  if (!Number.isFinite(anchorStart) || !Number.isFinite(focusStart)) return null
  const anchor = anchorStart + selectionTextLength(anchorEditor, selection.anchorNode, selection.anchorOffset)
  const focus = focusStart + selectionTextLength(focusEditor, selection.focusNode, selection.focusOffset)
  return { start: Math.min(anchor, focus), end: Math.max(anchor, focus) }
}

function normalizedSelectedText(value: string) {
  return value.replace(/\r\n?/g, "\n").replaceAll("\u00a0", " ").replaceAll("\u200b", "")
}

export function chooseFlowTextSelection(
  body: string,
  stored: TextSelection | null,
  live: TextSelection | null,
  selectedText: string,
) {
  const usable = (value: TextSelection | null): value is TextSelection => Boolean(
    value
    && value.start >= 0
    && value.start < value.end
    && value.end <= body.length,
  )
  const selected = normalizedSelectedText(selectedText)
  if (usable(stored) && normalizedSelectedText(body.slice(stored.start, stored.end)) === selected) return stored
  if (usable(live) && normalizedSelectedText(body.slice(live.start, live.end)) === selected) return live
  if (usable(stored)) return stored
  return usable(live) ? live : null
}

export function resolveFlowTextSelection(
  body: string,
  stored: TextSelection | null,
  selection = window.getSelection(),
) {
  return chooseFlowTextSelection(body, stored, readFlowTextSelection(selection), selection?.toString() ?? "")
}
