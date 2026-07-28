import {
  BookOpenText,
  BookMarked,
  Download,
  ImagePlus,
  LayoutTemplate,
  MessageCircleMore,
  Palette,
  Redo2,
  Undo2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { EditorTab } from "../types"

const TOOLS: Array<{ id: EditorTab; label: string; icon: LucideIcon }> = [
  { id: "manuscript", label: "원고", icon: BookOpenText },
  { id: "book", label: "책 정보", icon: BookMarked },
  { id: "theme", label: "테마", icon: Palette },
  { id: "image", label: "이미지", icon: ImagePlus },
  { id: "dialogue", label: "말풍선", icon: MessageCircleMore },
  { id: "layout", label: "지면", icon: LayoutTemplate },
  { id: "export", label: "내보내기", icon: Download },
]

type Props = {
  active: EditorTab
  canUndo: boolean
  canRedo: boolean
  onSelect: (tab: EditorTab) => void
  onUndo: () => void
  onRedo: () => void
}

export function ToolRail({ active, canUndo, canRedo, onSelect, onUndo, onRedo }: Props) {
  return (
    <nav className="tool-rail" aria-label="편집 도구">
      <div className="brand-mark" aria-label="햄스터의 집">
        <span className="burrow-mark"><i /></span>
      </div>
      <div className="history-tools">
        <button className="icon-button" type="button" onClick={onUndo} disabled={!canUndo} title="실행 취소 (Ctrl+Z)">
          <Undo2 aria-hidden="true" />
        </button>
        <button className="icon-button" type="button" onClick={onRedo} disabled={!canRedo} title="다시 실행 (Ctrl+Y)">
          <Redo2 aria-hidden="true" />
        </button>
      </div>
      <div className="tool-list">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              className={active === tool.id ? "tool-button is-active" : "tool-button"}
              type="button"
              key={tool.id}
              data-preserve-page-selection={tool.id === "manuscript" ? true : undefined}
              onClick={() => onSelect(tool.id)}
              aria-pressed={active === tool.id}
              title={tool.label}
            >
              <Icon aria-hidden="true" />
              <span>{tool.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
