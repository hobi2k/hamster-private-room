import type { BookDocument, MemberProfile, ThemePreset } from "../types"

function cloneMembers(members: MemberProfile[]) {
  return members.map((member) => ({ ...member }))
}

function normalizedName(name: string) {
  return name.trim().toLocaleLowerCase("ko")
}

export function createThemeSnapshot(document: BookDocument, id: string, name: string): ThemePreset {
  const members = cloneMembers(document.members)
  return {
    id,
    name: name.trim(),
    description: members.length
      ? `지면 설정 · 말풍선 멤버 ${members.length}명`
      : "내가 저장한 지면 설정",
    colors: [document.options.backgroundColor, document.options.quoteColor, document.options.bracketColor],
    options: { ...document.options, coverImage: "" },
    members,
  }
}

export function mergeThemeMembers(current: MemberProfile[], saved: MemberProfile[]) {
  const merged = cloneMembers(current)
  for (const presetMember of saved) {
    const exact = merged.findIndex((member) => member.id === presetMember.id)
    const byName = exact === -1
      ? merged.findIndex((member) => normalizedName(member.name) === normalizedName(presetMember.name))
      : -1
    const index = exact >= 0 ? exact : byName
    if (index >= 0) {
      // Keep the current book's id when matching by name so its existing
      // bubbles remain linked while receiving the saved profile/style.
      merged[index] = { ...presetMember, id: merged[index].id }
    } else {
      merged.push({ ...presetMember })
    }
  }
  return merged
}

export function applyThemeSnapshot(document: BookDocument, theme: ThemePreset): BookDocument {
  const options = { ...document.options, ...theme.options, themeId: theme.id }
  if (!theme.members) return { ...document, options }

  const members = mergeThemeMembers(document.members, theme.members)
  const speechBubbles = document.speechBubbles.map((bubble) => {
    const member = members.find((item) => item.id === bubble.profileId)
    if (!member) return bubble
    return {
      ...bubble,
      speakerName: member.name,
      bubbleColor: member.bubbleColor,
      textColor: member.textColor,
      nameColor: member.nameColor ?? member.textColor,
      nameOutline: member.nameOutline ?? false,
      nameOutlineColor: member.nameOutlineColor ?? "#ffffff",
      showName: !member.hideName,
    }
  })

  return { ...document, options, members, speechBubbles }
}
