import { ArrowRight, FilePlus2, FolderOpen, Upload } from "lucide-react"
import { useRef } from "react"
import type { CSSProperties } from "react"
type Props = {
  hasDraft: boolean
  onNew: () => void
  onContinue: () => void
  onImport: (file: File) => void
}

export function HomeScreen({ hasDraft, onNew, onContinue, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const style = {
    "--hamster-sprite": `url(${import.meta.env.BASE_URL}assets/hamster-walk.png)`,
  } as CSSProperties
  return (
    <main className="home-screen" style={style}>
      <span className="floating-seed seed-one" aria-hidden="true" />
      <span className="floating-seed seed-two" aria-hidden="true" />
      <span className="floating-seed seed-three" aria-hidden="true" />
      <span className="floating-seed seed-four" aria-hidden="true" />

      <header className="home-header">
        <div className="home-brand">
          <div className="home-brand-mark" aria-hidden="true">
            <span className="burrow-mark"><i /></span>
          </div>
          <div className="home-brand-copy">
            <strong>햄스터의 집</strong>
            <span>포근한 굴 속 문장 작업실</span>
          </div>
        </div>
        <span className="home-motto"><i aria-hidden="true" />씨앗 모으듯, 문장 모으기</span>
      </header>

      <section className="home-stage" aria-labelledby="home-title">
        <div className="home-copy">
          <span className="home-kicker">오늘도 폭신하게,</span>
          <h1 id="home-title">작고 사적인 방</h1>
          <p>문장과 장면을 이불처럼 덮어, 나만의 작은 책으로 엮어 두는 곳이에요.</p>
          <div className="home-chips" aria-label="지원 기능">
            <span><i aria-hidden="true" />자동 저장</span>
            <span>PNG 내보내기</span>
          </div>
        </div>

        <div className="home-burrow-wrap" aria-hidden="true">
          <div className="home-burrow">
            <span className="lamp-cord" />
            <span className="lamp-shade" />
            <span className="lamp-glow" />
            <div className="tiny-shelf">
              <span className="shelf-board" />
              <span className="tiny-books"><i /><i /><i /><i /></span>
            </div>
            <span className="burrow-floor" />
            <span className="rug-shadow" />
            <span className="burrow-rug" />
            <div className="home-hamster-viewport">
              <div className="home-hamster-strip" />
            </div>
          </div>
        </div>
      </section>

      <section className="home-actions" aria-label="책 작업 시작">
        <button className="home-action is-primary" type="button" onClick={onNew}>
          <span className="home-action-icon"><FilePlus2 aria-hidden="true" /></span>
          <span className="home-action-copy"><strong>새 책 만들기</strong><small>새 이불 깔고 시작하기</small></span>
          <ArrowRight aria-hidden="true" />
        </button>
        <button className="home-action" type="button" onClick={onContinue} disabled={!hasDraft}>
          <span className="home-action-icon"><FolderOpen aria-hidden="true" /></span>
          <span className="home-action-copy"><strong>최근 작업 이어쓰기</strong><small>덮어둔 이불 다시 펴기</small></span>
          <ArrowRight aria-hidden="true" />
        </button>
        <button className="home-action" type="button" onClick={() => fileRef.current?.click()}>
          <span className="home-action-icon"><Upload aria-hidden="true" /></span>
          <span className="home-action-copy"><strong>작업 파일 불러오기</strong><small>다른 굴에서 가져오기</small></span>
          <ArrowRight aria-hidden="true" />
        </button>
        <input
          className="visually-hidden"
          ref={fileRef}
          type="file"
          accept=".hamsterbook,.json,application/json,application/x-hamster-book+json"
          onChange={(event) => event.target.files?.[0] && onImport(event.target.files[0])}
        />
      </section>
    </main>
  )
}
