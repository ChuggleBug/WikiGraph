import { FitIcon, MinusIcon, PlusIcon, TrashIcon } from './icons'

interface Props {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onClear: () => void
  canClear: boolean
}

export function ViewControls({ onZoomIn, onZoomOut, onReset, onClear, canClear }: Props) {
  return (
    <div className="wg-panel wg-controls">
      <button className="wg-icbtn" onClick={onZoomIn} aria-label="Zoom in">
        <PlusIcon size={18} />
      </button>
      <button className="wg-icbtn" onClick={onZoomOut} aria-label="Zoom out">
        <MinusIcon />
      </button>
      <button className="wg-icbtn" onClick={onReset} aria-label="Reset view">
        <FitIcon />
      </button>
      <div className="sep" />
      <button
        className="wg-icbtn wg-icbtn--danger"
        onClick={onClear}
        disabled={!canClear}
        aria-label="Clear canvas"
      >
        <TrashIcon />
      </button>
    </div>
  )
}
