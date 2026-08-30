import { describe, expect, it } from "vitest"
import { applyMemberPatch } from "./member"
import type { MemberProfile, SpeechBubble } from "../types"

const member: MemberProfile = {
  id: "member-1",
  name: "정민",
  avatar: "",
  avatarScale: 100,
  avatarX: 50,
  avatarY: 50,
  bubbleColor: "#ffffff",
  textColor: "#111111",
}

const bubble = {
  id: "bubble-1",
  page: 1,
  anchor: 0,
  profileId: member.id,
  speakerName: member.name,
  text: "안녕",
  secondaryText: "",
  x: 10,
  y: 10,
  width: 50,
  side: "left",
  bubbleColor: member.bubbleColor,
  textColor: member.textColor,
  zIndex: 1,
} satisfies SpeechBubble

describe("member updates", () => {
  it("propagates member colors to every linked bubble", () => {
    const result = applyMemberPatch([member], [bubble, { ...bubble, id: "bubble-2" }], member.id, {
      bubbleColor: "#ffccdd",
      textColor: "#332211",
    })
    expect(result.bubbles).toHaveLength(2)
    expect(result.bubbles.every((item) => item.bubbleColor === "#ffccdd" && item.textColor === "#332211")).toBe(true)
  })

  it("does not alter unlinked bubbles", () => {
    const other = { ...bubble, id: "other", profileId: "member-2" }
    expect(applyMemberPatch([member], [other], member.id, { bubbleColor: "#ffccdd" }).bubbles[0]).toEqual(other)
  })
})
