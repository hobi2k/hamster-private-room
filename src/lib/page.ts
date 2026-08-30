import type { BookOptions, PageAppearance, PageMeta, PaperPreset, TextMetaStyle } from "../types"

const PAPER_RATIOS: Record<Exclude<PaperPreset, "custom">, number> = {
  a4: 210 / 148,
  a5: 148 / 105,
  b6: 182 / 128,
}

export function pageHeightForPreset(preset: PaperPreset, width: number, customHeight: number) {
  return preset === "custom" ? customHeight : Math.round(width * PAPER_RATIOS[preset])
}

export function defaultPageAppearance(options: BookOptions): PageAppearance {
  return {
    backgroundType: options.backgroundType,
    backgroundColor: options.backgroundColor,
    gradientStart: options.gradientStart,
    gradientEnd: options.gradientEnd,
    gradientAngle: options.gradientAngle,
  }
}

function metaStyle(font: string, size: number, color: string, bold = false, opacity = 1): TextMetaStyle {
  return { font, size, color, italic: false, bold, opacity }
}

export function defaultPageMeta(_title: string, options: BookOptions): PageMeta {
  return {
    title: "",
    subtitle: "",
    bookName: "",
    characterName: "",
    titleStyle: metaStyle(options.fontFamily, 19, options.textColor, true),
    subtitleStyle: metaStyle(options.fontFamily, 13, options.quoteColor, true),
    bookNameStyle: metaStyle(options.fontFamily, 11, options.textColor, false, 0.62),
    characterNameStyle: metaStyle(options.fontFamily, 11, options.textColor, false, 0.62),
  }
}

export function pageBackground(appearance: PageAppearance) {
  return appearance.backgroundType === "gradient"
    ? `linear-gradient(${appearance.gradientAngle}deg, ${appearance.gradientStart}, ${appearance.gradientEnd})`
    : appearance.backgroundColor
}
