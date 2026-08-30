import type { MemberProfile, SpeechBubble } from "../types"

export function applyMemberPatch(
  members: MemberProfile[],
  bubbles: SpeechBubble[],
  id: string,
  patch: Partial<MemberProfile>,
) {
  return {
    members: members.map((member) => member.id === id ? { ...member, ...patch } : member),
    bubbles: bubbles.map((bubble) => bubble.profileId === id ? {
      ...bubble,
      ...(patch.name !== undefined ? { speakerName: patch.name } : {}),
      ...(patch.bubbleColor !== undefined ? { bubbleColor: patch.bubbleColor } : {}),
      ...(patch.textColor !== undefined ? { textColor: patch.textColor } : {}),
      ...(patch.hideName !== undefined ? { showName: !patch.hideName } : {}),
      ...(patch.nameColor !== undefined ? { nameColor: patch.nameColor } : {}),
      ...(patch.nameOutline !== undefined ? { nameOutline: patch.nameOutline } : {}),
      ...(patch.nameOutlineColor !== undefined ? { nameOutlineColor: patch.nameOutlineColor } : {}),
    } : bubble),
  }
}
