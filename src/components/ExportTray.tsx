import { Download, FolderDown, X } from "lucide-react"
import type { ExportFile } from "../lib/export"

type Props = {
  files: ExportFile[]
  saving: boolean
  canSaveDirectory: boolean
  onDownload: (file: ExportFile) => void
  onSaveDirectory: () => void
  onClose: () => void
}

export function ExportTray({ files, saving, canSaveDirectory, onDownload, onSaveDirectory, onClose }: Props) {
  if (!files.length) return null
  return (
    <div className="export-tray-backdrop" role="presentation">
      <section className="export-tray" role="dialog" aria-modal="true" aria-labelledby="export-tray-title">
        <header>
          <div>
            <span>PNG 내보내기</span>
            <h2 id="export-tray-title">{files.length}개 파일 준비됨</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} title="내보내기 닫기">
            <X aria-hidden="true" />
          </button>
        </header>
        {canSaveDirectory ? (
          <button className="export-save-directory" type="button" onClick={onSaveDirectory} disabled={saving}>
            <FolderDown aria-hidden="true" />
            <span>{saving ? "폴더에 저장 중" : "폴더에 모두 저장"}</span>
          </button>
        ) : null}
        <div className="export-file-list">
          {files.map((file) => (
            <div className="export-file-row" key={file.filename}>
              <span>{file.filename}</span>
              <button className="icon-button" type="button" onClick={() => onDownload(file)} title={`${file.filename} 저장`}>
                <Download aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
