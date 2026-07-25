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
