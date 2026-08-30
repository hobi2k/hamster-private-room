import type { BookOptions, MarkKind } from "../types"

export function consumeSmartSyntax(value: string, options: BookOptions) {
  const marks: Array<{ start: number; end: number; kind: MarkKind; value: string; source: "smart-bold" | "smart-asterisk" }> = []
  const offsetMap = Array.from({ length: value.length + 1 }, () => 0)
  let output = ""
  let index = 0
  offsetMap[0] = 0

  const appendToken = (contentStart: number, contentEnd: number, tokenEnd: number, kind: MarkKind, markValue: string, source: "smart-bold" | "smart-asterisk") => {
    const outputStart = output.length
    for (let cursor = index; cursor <= contentStart; cursor += 1) offsetMap[cursor] = outputStart
    output += value.slice(contentStart, contentEnd)
    for (let cursor = contentStart; cursor <= contentEnd; cursor += 1) offsetMap[cursor] = outputStart + cursor - contentStart
    for (let cursor = contentEnd; cursor <= tokenEnd; cursor += 1) offsetMap[cursor] = output.length
    if (output.length > outputStart) marks.push({ start: outputStart, end: output.length, kind, value: markValue, source })
    index = tokenEnd
  }

  while (index < value.length) {
    if (options.smartBold && value.startsWith("**", index)) {
      const closing = value.indexOf("**", index + 2)
      if (closing > index + 2 && !value.slice(index + 2, closing).includes("*")) {
        appendToken(index + 2, closing, closing + 2, "bold", "700", "smart-bold")
        continue
      }
    }
    if (options.smartAsterisk && value[index] === "*" && value[index + 1] !== "*" && value[index - 1] !== "*") {
      const closing = value.indexOf("*", index + 1)
      if (closing > index + 1 && value[closing + 1] !== "*") {
        appendToken(index + 1, closing, closing + 1, options.asteriskItalic ? "italic" : "color", options.asteriskItalic ? "italic" : options.asteriskColor, "smart-asterisk")
        continue
      }
    }
    offsetMap[index] = output.length
    output += value[index]
    index += 1
    offsetMap[index] = output.length
  }
  return {
    text: output,
    marks,
    mapOffset: (offset: number) => offsetMap[Math.max(0, Math.min(value.length, offset))] ?? output.length,
  }
}
