import { describe, expect, it } from "vitest"
import { sanitizeHtml } from "./html"

describe("sanitizeHtml", () => {
  it("removes scripts and inline event handlers while keeping card markup", () => {
    const sanitized = sanitizeHtml('<div onclick="alert(1)" style="padding:12px">안전</div><script>alert(2)</script>')
    expect(sanitized).toContain("안전")
    expect(sanitized).toContain("padding:12px")
    expect(sanitized).not.toMatch(/onclick|script|alert/i)
  })

  it("removes javascript URLs", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">링크</a>')).not.toMatch(/javascript:/i)
  })
})
