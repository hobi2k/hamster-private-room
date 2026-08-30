import { describe, expect, it } from "vitest"
import { DEFAULT_OPTIONS } from "../data/themes"
import type { BookDocument, MemberProfile, SpeechBubble, ThemePreset } from "../types"
import { applyThemeSnapshot, createThemeSnapshot } from "./themePreset"

const member: MemberProfile = {
  id: "member-1",
  name: "정민",
  avatar: "data:image/png;base64,avatar",
  avatarScale: 120,
  avatarX: 48,
  avatarY: 52,
  bubbleColor: "#ffeecc",
  textColor: "#332211",
  nameColor: "#cc5522",
  nameOutline: true,
  nameOutlineColor: "#ffffff",
}

const bubble: SpeechBubble = {
  id: "bubble-1",
  page: 1,
  anchor: 0,
  profileId: member.id,
  speakerName: "이전 이름",
  text: "대사 내용은 책에 남는다",
  secondaryText: "",
  x: 10,
  y: 10,
  width: 50,
  side: "left",
  bubbleColor: "#000000",
  textColor: "#ffffff",
  zIndex: 1,
}

function documentWith(overrides: Partial<BookDocument> = {}): BookDocument {
  return {
    version: 1,
    title: "테스트",
    body: "본문",
    options: { ...DEFAULT_OPTIONS },
    images: [],
    members: [member],
    speechBubbles: [bubble],
    dividers: [],
    inlineImages: [],
    htmlCards: [],
    stickers: [],
    stickerAssets: [],
    marks: [],
    footers: {},
    pageAppearances: {},
    pageMetas: {},
    updatedAt: "2026-08-30T00:00:00.000Z",
    ...overrides,
  }
}

describe("theme speech settings", () => {
  it("saves member avatars and bubble styles without bubble content", () => {
    const preset = createThemeSnapshot(documentWith(), "custom-1", "대화 테마")
    expect(preset.members?.[0]).toMatchObject({
      avatar: member.avatar,
      bubbleColor: member.bubbleColor,
      textColor: member.textColor,
    })
    expect(preset).not.toHaveProperty("speechBubbles")
    expect(preset.options.coverImage).toBe("")
  })

  it("applies saved member styles to linked existing bubbles", () => {
    const theme: ThemePreset = {
      id: "custom-1",
      name: "대화 테마",
      description: "",
      colors: ["#fff", "#000", "#333"],
      options: { fontFamily: "Pretendard" },
      members: [member],
    }
    const result = applyThemeSnapshot(documentWith(), theme)
    expect(result.speechBubbles[0]).toMatchObject({
      text: bubble.text,
      speakerName: member.name,
      bubbleColor: member.bubbleColor,
      textColor: member.textColor,
      nameOutline: true,
    })
  })

  it("matches members by name without breaking current bubble ids", () => {
    const current = { ...member, id: "current-id", bubbleColor: "#000000" }
    const theme = createThemeSnapshot(documentWith(), "custom-1", "대화 테마")
    const result = applyThemeSnapshot(documentWith({
      members: [current],
      speechBubbles: [{ ...bubble, profileId: current.id }],
    }), theme)
    expect(result.members[0].id).toBe(current.id)
    expect(result.speechBubbles[0].profileId).toBe(current.id)
    expect(result.speechBubbles[0].bubbleColor).toBe(member.bubbleColor)
  })
})
