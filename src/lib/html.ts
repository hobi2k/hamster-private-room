const BLOCKED_TAGS = new Set(["SCRIPT", "IFRAME", "OBJECT", "EMBED", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT", "LINK", "META", "BASE"])
const URL_ATTRIBUTES = new Set(["href", "src", "poster", "xlink:href"])

export function sanitizeHtml(raw: string) {
  if (typeof DOMParser === "undefined") return raw
    .replace(/<(script|iframe|object|embed|form|input|button|textarea|select|link|meta|base)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|iframe|object|embed|form|input|button|textarea|select|link|meta|base)\b[^>]*\/?\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src|poster|xlink:href)\s*=\s*(["'])\s*(?:javascript|data:text\/html):[\s\S]*?\2/gi, "")
    .trim()
  const parsed = new DOMParser().parseFromString(`<div>${raw}</div>`, "text/html")
  const root = parsed.body.firstElementChild
  if (!root) return ""
  root.querySelectorAll("*").forEach((element) => {
    if (BLOCKED_TAGS.has(element.tagName)) {
      element.remove()
      return
    }
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      if (name.startsWith("on") || name === "srcdoc") element.removeAttribute(attribute.name)
      else if (URL_ATTRIBUTES.has(name) && /^(?:javascript|data:text\/html):/i.test(value)) element.removeAttribute(attribute.name)
      else if (name === "style" && /(?:url\s*\(|expression\s*\(|@import|javascript:)/i.test(value)) element.removeAttribute(attribute.name)
    })
  })
  return root.innerHTML.trim()
}
