import type { CSSProperties } from "react"
import type { MemberProfile } from "../types"

export function avatarFrame(member: Pick<MemberProfile, "avatarAspectRatio" | "avatarScale">) {
  const aspectRatio = Math.max(0.1, member.avatarAspectRatio ?? 1)
  const zoom = (member.avatarScale ?? 100) / 100
  return {
    width: (aspectRatio >= 1 ? aspectRatio * 100 : 100) * zoom,
    height: (aspectRatio >= 1 ? 100 : 100 / aspectRatio) * zoom,
  }
}

export function clampAvatarCenter(value: number, size: number) {
  return Math.max(100 - size / 2, Math.min(size / 2, value))
}

export function avatarStyle(member: MemberProfile): CSSProperties {
  const frame = avatarFrame(member)
  return {
    width: `${frame.width}%`,
    height: `${frame.height}%`,
    left: `${member.avatarX ?? 50}%`,
    top: `${member.avatarY ?? 50}%`,
    transform: "translate(-50%, -50%)",
  }
}
