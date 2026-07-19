export type EditorTab = "manuscript" | "theme" | "image" | "dialogue" | "layout" | "footer" | "export"
export type CoverMode = "image-text" | "image" | "text" | "none"
export type ExportMode = "selected" | "single" | "spread"
export type MarkKind = "highlight" | "color" | "italic" | "bold"

export type TextMark = {
  id: string
  start: number
  end: number
  kind: MarkKind
  value: string
}

export type TextSelection = {
  start: number
  end: number
}

export type ImageLayer = {
  id: string
  page: number
  src: string
  name: string
  x: number
  y: number
  width: number
  rotation: number
  opacity: number
  zIndex: number
}

export type MemberProfile = {
  id: string
  name: string
  avatar: string
  bubbleColor: string
  textColor: string
}

export type SpeechBubble = {
  id: string
  page: number
  profileId: string
  speakerName: string
  text: string
  secondaryText: string
  x: number
  y: number
  width: number
  side: "left" | "right"
  bubbleColor: string
  textColor: string
  zIndex: number
}

export type FooterNote = {
  title: string
  subtitle: string
  color: string
  italic: boolean
  weight: number
}

export type BookOptions = {
  themeId: string
  pageWidth: number
  paddingX: number
  paddingY: number
  fontFamily: string
  customFont: string
  fontWeight: number
  fontSize: number
  lineHeight: number
  letterSpacing: number
  paragraphSpacing: number
  scaleX: number
  textColor: string
  backgroundColor: string
  pageTexture: string
  quoteColor: string
  quoteItalic: boolean
  bracketColor: string
  bracketItalic: boolean
  accentColors: [string, string, string]
  coverMode: CoverMode
  coverTitle: string
  coverSubtitle: string
  coverImage: string
}

export type BookDocument = {
  version: 1
  title: string
  body: string
  options: BookOptions
  images: ImageLayer[]
  members: MemberProfile[]
  speechBubbles: SpeechBubble[]
  marks: TextMark[]
  footers: Record<number, FooterNote>
  updatedAt: string
}

export type ThemePreset = {
  id: string
  name: string
  description: string
  colors: [string, string, string]
  options: Partial<BookOptions>
}

export type PageSlice = {
  text: string
  start: number
  end: number
}

export type ToastState = {
  message: string
  tone: "default" | "success" | "warn"
}

export type LocalFontSource = {
  family: string
  fullName: string
}

declare global {
  interface Window {
    queryLocalFonts?: () => Promise<LocalFontSource[]>
  }
}
