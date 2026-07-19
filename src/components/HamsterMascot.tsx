import type { CSSProperties } from "react"

type Props = {
  message: string
  active?: boolean
}

export function HamsterMascot({ message, active = false }: Props) {
  const style = {
    "--hamster-sprite": `url(${import.meta.env.BASE_URL}assets/hamster-walk.png)`,
  } as CSSProperties

  return (
    <div className={active ? "mascot is-busy" : "mascot"} style={style} aria-live="polite">
      <div className="mascot-message">{message}</div>
      <div className="hamster-viewport" aria-hidden="true">
        <div className="hamster-strip" />
      </div>
    </div>
  )
}
