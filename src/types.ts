export type EditorTab = "manuscript" | "book" | "theme" | "image" | "dialogue" | "decorate" | "layout" | "export"
export type CoverMode = "image-text" | "image" | "text" | "none"
export type ExportMode = "selected" | "single" | "spread"
export type MarkKind = "highlight" | "color" | "italic" | "bold" | "underline" | "strike" | "font" | "align"
export type PaperPreset = "custom" | "a4" | "a5" | "b6"
export type BackgroundType = "solid" | "gradient"

export type TextMark = {
  id: string
  start: number
  end: number
  kind: MarkKind
  value: string
  source?: "smart-bold" | "smart-asterisk"
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
  height?: number
  stretch?: boolean
  rotation: number
  opacity: number
  grayscale?: boolean
  overlay?: number
  zIndex: number
  aspectRatio?: number
}

export type MemberProfile = {
  id: string
  name: string
  avatar: string
  avatarAspectRatio?: number
  avatarScale: number
  avatarX: number
  avatarY: number
  bubbleColor: string
  textColor: string
  backgroundColor?: string
  label?: string
  labelColor?: string
  nameColor?: string
  nameOutline?: boolean
  nameOutlineColor?: string
  hideName?: boolean
}

export type SpeechBubble = {
  id: string
  page: number
  anchor: number
  profileId: string
  speakerName: string
  text: string
  secondaryText: string
  x: number
  y: number
  width: number
  autoWidth?: boolean
  textScale?: number
  secondaryTextScale?: number
  showName?: boolean
  side: "left" | "right"
  bubbleColor: string
  textColor: string
  nameColor?: string
  nameOutline?: boolean
  nameOutlineColor?: string
  continuation?: boolean
  zIndex: number
  flowRank?: number
}

export type DividerStyle = "solid" | "dashed" | "diamond" | "dots" | "asterism" | "wave"

export type DividerBlock = {
  id: string
  anchor: number
  style: DividerStyle
  color: string
  order: number
}

export type InlineImageBlock = {
  id: string
  anchor: number
  src: string
  name: string
  width: number
  aspectRatio: number
  height?: number
  opacity?: number
  scale: number
  x: number
  y: number
  align: "left" | "center" | "right"
  order: number
}

export type HtmlCardBlock = {
  id: string
  anchor: number
  html: string
  width: number
  scale: number
  align: "left" | "center" | "right"
  order: number
}

export type StickerKind = "heart" | "star" | "sparkle" | "flower" | "smile" | "leaf" | "moon" | "custom"

export type StickerLayer = {
  id: string
  page: number
  kind: StickerKind
  src?: string
  name: string
  x: number
  y: number
  size: number
  rotation: number
  flipped: boolean
  color: string
  zIndex: number
}

export type StickerAsset = {
  id: string
  name: string
  src: string
}

export type PageAppearance = {
  backgroundType: BackgroundType
  backgroundColor: string
  gradientStart: string
  gradientEnd: string
  gradientAngle: number
}

export type TextMetaStyle = {
  font: string
  size: number
  color: string
  italic: boolean
  bold: boolean
  opacity: number
}

export type PageMeta = {
  title: string
  subtitle: string
  bookName: string
  characterName: string
  titleStyle: TextMetaStyle
  subtitleStyle: TextMetaStyle
  bookNameStyle: TextMetaStyle
  characterNameStyle: TextMetaStyle
}

export type FooterNote = {
  title: string
  subtitle: string
  titleFont: string
  subtitleFont: string
  color: string
  italic: boolean
  weight: number
}

export type BookOptions = {
  themeId: string
  paperPreset: PaperPreset
  pageWidth: number
  pageHeight: number
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
  defaultTextAlign: "left" | "center" | "right" | "justify"
  wordBreak: "keep-all" | "break-all"
  textColor: string
  backgroundColor: string
  backgroundType: BackgroundType
  gradientStart: string
  gradientEnd: string
  gradientAngle: number
  pageTexture: string
  quoteColor: string
  smartQuote: boolean
  quoteItalic: boolean
  bracketColor: string
  smartBracket: boolean
  bracketItalic: boolean
  smartBold: boolean
  smartAsterisk: boolean
  asteriskColor: string
  asteriskItalic: boolean
  accentColors: [string, string, string]
  highlightColor: string
  highlightOpacity: number
  coverMode: CoverMode
  coverTitle: string
  coverTitleFont: string
  coverTitleColor: string
  coverSubtitle: string
  coverSubtitleFont: string
  coverSubtitleColor: string
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
  dividers: DividerBlock[]
  inlineImages: InlineImageBlock[]
  htmlCards: HtmlCardBlock[]
  stickers: StickerLayer[]
  stickerAssets: StickerAsset[]
  marks: TextMark[]
  footers: Record<number, FooterNote>
  pageAppearances: Record<number, PageAppearance>
  pageMetas: Record<number, PageMeta>
  updatedAt: string
}

export type BookSlot = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  bodyLength: number
  backgroundColor: string
  accentColor: string
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
  blockIds?: string[]
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
