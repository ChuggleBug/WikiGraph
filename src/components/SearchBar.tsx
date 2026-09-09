import { useEffect, useId, useRef, useState } from 'react'
import { ApiError, searchTitles } from '../api'
import { SearchIcon, SpinnerIcon } from './icons'
import titleTransform from '../titleTransform'

interface Props {
  onPick: (title: string) => void
}

type Status = 'idle' | 'loading' | 'done' | 'error'

export function SearchBar({ onPick }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [titles, setTitles] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const trimmed = query.trim()

  const changeQuery = (value: string) => {
    setQuery(value)
    if (!value.trim()) {
      setTitles([])
      setStatus('idle')
    }
  }

  useEffect(() => {
    if (!trimmed) return
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setStatus('loading')
      try {
        const res = await searchTitles(trimmed, ctrl.signal)
        setTitles(res.titles)
        setActive(0)
        setStatus('done')
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Search failed')
        setStatus('error')
      }
    }, 200)
    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [trimmed])

  const open = focused && trimmed.length > 0

  const pick = (title: string) => {
    onPick(title)
    setQuery('')
    setTitles([])
    setStatus('idle')
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('')
      inputRef.current?.blur()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, titles.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && titles[active]) {
      pick(titles[active])
    }
  }

  return (
    // The entire search bar should make the input focused when clicked
    <div className={`wg-panel wg-search${open ? ' wg-search--open' : ''}`} onClick={() => inputRef.current?.focus()}>
      <div className="wg-search-input">
        <SearchIcon size={17} />
        <input
          name="search bar"
          ref={inputRef}
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Search Wikipedia articles…"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        {status === 'loading' && <SpinnerIcon size={14} />}
        {open && status === 'done' && (
          <span className="wg-search-count">
            {titles.length} {titles.length === 1 ? 'result' : 'results'}
          </span>
        )}
      </div>

      {open && (
        <>
          <div className="wg-results" id={listId} role="listbox">
            {status === 'error' && (
              <div className="wg-result wg-result--empty">{error}</div>
            )}
            {status === 'done' && titles.length === 0 && (
              <div className="wg-result wg-result--empty">
                No matching articles.
              </div>
            )}
            {titles.map((title, i) => (
              <button
                key={title}
                type="button"
                role="option"
                aria-selected={i === active}
                className="wg-result"
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(title)}
              >
                <span style={{ flex: 1 }}>{titleTransform(title)}</span>
                {i === active && <span className="ret">↵</span>}
              </button>
            ))}
          </div>
          <div className="wg-search-foot">
            <span>
              <b>↑↓ (arrows)</b> navigate
            </span>
            <span>
              <b>↵ (enter)</b> add to graph
            </span>
            <span>
              <b>esc</b> dismiss
            </span>
          </div>
        </>
      )}
    </div>
  )
}
