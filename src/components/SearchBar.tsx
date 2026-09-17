import { useId, useRef, useState } from 'react'
import { ApiError, searchTitles } from '../api'
import { SearchIcon, SpinnerIcon } from './icons'
import titleTransform from '../titleTransform'

interface Props {
  /** Resolves to whether the title was actually added (false if the API doesn't track it). */
  onPick: (title: string) => Promise<boolean>
}

type Status = 'idle' | 'loading' | 'done' | 'error'
type Mode = 'search' | 'link'

/** Parses a Wikipedia article URL's `/wiki/<title>` segment, dropping any `#fragment`. */
function parseWikipediaUrl(value: string): string | null {
  const match = value.match(/\/wiki\/([^#?]+)/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export function SearchBar({ onPick }: Props) {
  const [mode, setMode] = useState<Mode>('search')
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [titles, setTitles] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listId = useId()

  const trimmed = query.trim()

  const changeQuery = (value: string) => {
    setQuery(value)
    if (mode === 'link') {
      setStatus('idle')
    } else if (!value.trim()) {
      setTitles([])
      setStatus('idle')
      setSearchedQuery(null)
    }
  }

  const toggleMode = () => {
    setMode((m) => (m === 'search' ? 'link' : 'search'))
    setQuery('')
    setTitles([])
    setStatus('idle')
    setError('')
    setSearchedQuery(null)
    inputRef.current?.focus()
  }

  const runSearch = async () => {
    if (!trimmed) return
    setStatus('loading')
    setSearchedQuery(trimmed)
    try {
      const res = await searchTitles(trimmed)
      if (res.titles.length === 0) {
        setError('No results')
        setStatus('error')
      }
      else {
        setTitles(res.titles)
        setActive(0)
        setStatus('done')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed')
      setStatus('error')
    }
  }

  // Is there any text inside of the search bar
  const open = focused && trimmed.length > 0

  // Input text was changed after search
  const stale = searchedQuery !== trimmed

  const pick = async (title: string) => {
    setStatus('loading')
    const added = await onPick(title)
    if (added) {
      setQuery('')
      setTitles([])
      setStatus('idle')
      setSearchedQuery(null)
      inputRef.current?.blur()
    } else {
      setError("This article isn't tracked by this site")
      setStatus('error')
    }
  }

  // Just a small wrapper for pick
  const submitLink = (trimmed: string) => {
    setSearchedQuery(trimmed)
    const title = parseWikipediaUrl(trimmed)
    if (title) {
      void pick(title)
    } else {
      setError('Not a valid Wikipedia article link.')
      setStatus('error')
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Leave
    if (e.key === 'Escape') {
      setQuery('')
      inputRef.current?.blur()
    }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (mode === 'search') {
        if (searchedQuery === trimmed && status !== 'loading') {
          if (titles[active]) void pick(titles[active])
        } else {
          // Need to get a selection of titles
          void runSearch()
        }
      }
      else if (mode === 'link') {
        if (e.key === 'Enter') {
          if (trimmed) {
            submitLink(trimmed)
          }
        }
      }
      else {
        console.log("Unknown Search mode:", mode)
      }
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, titles.length - 1))
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    }
  }

  return (
    <div className={`wg-panel wg-search${open ? ' wg-search--open' : ''}`}>
      <div style={{ position: 'fixed', zIndex: '50', display: 'flex', gap: '5', flexDirection: 'column', right: '50px' }}>
        <span>mode: {mode}</span>
        <span>query: {query}</span>
        <span>focused: {focused ? "true" : 'false'}</span>
        <span>titles: {titles}</span>
        <span>status: {status}</span>
        <span>error: {error}</span>
        <span>active: {active}</span>
        <span>searchedQuery: {searchedQuery}</span>
        <span>trimmed: {trimmed}</span>
        <span>open: {open ? "true" : 'false'}</span>
        <span>stale: {stale ? "true" : 'false'}</span>
      </div>

      {/* Top Search Bar segment */}
      <div
        className="wg-search-input"
        onMouseDown={(e) => {
          if (!(e.target as HTMLElement).closest('button, input')) {
            e.preventDefault()
            inputRef.current?.focus()
          }
        }}
      >
        {/* Input text box */}
        <SearchIcon size={17} />
        <input
          name="search bar"
          ref={inputRef}
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          onFocus={() => {
            if (blurTimeoutRef.current !== null) {
              clearTimeout(blurTimeoutRef.current)
              blurTimeoutRef.current = null
            }
            setFocused(true)
          }}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => {
              blurTimeoutRef.current = null
              setFocused(false)
            }, 120)
          }}
          onKeyDown={onKeyDown}
          placeholder={
            mode === 'link'
              ? 'Paste a Wikipedia article link...'
              : 'Search Wikipedia articles...'
          }
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />

        {/* Which mode button */}
        <button type="button" onClick={toggleMode}>
          <span data-hidden={mode !== 'search'}>Search Mode</span>
          <span data-hidden={mode !== 'link'}>URL Mode</span>
        </button>
      </div>

      {focused && mode === 'link' && (
        <>
          {status === 'error' && (
            <div className='wg-results'>
              <div className='wg-result wg-result--empty'>
                {error}
              </div>
            </div>
          )}

          <div className='wg-search-foot' results-shown={`${(open && stale)}`}>
            <div className='wg-search-foot-help'>
              <span>
                <b>↵ (enter)</b> {stale ? 'search' : 'add to graph'}
              </span>
              <span>
                <b>esc</b> dismiss
              </span>
            </div>
          </div>
        </>
      )}

      {focused && mode === 'search' && (
        <>
          <div className="wg-results" id={listId} role="listbox">
            {!stale && status === 'error' && (
              <div className="wg-result wg-result--empty">{error}</div>
            )}
            {!stale && status === 'done' && titles.length === 0 && (
              <div className="wg-result wg-result--empty">
                No matching articles.
              </div>
            )}
            {!stale &&
              titles.map((title, i) => (
                <button
                  key={title}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className="wg-result"
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void pick(title)}
                >
                  <span style={{ flex: 1 }}>{titleTransform(title)}</span>
                  {i === active && <span className="ret">↵</span>}
                </button>
              ))}
          </div>
          <div className="wg-search-foot" results-shown={`${(open && stale)}`}>
            <div className="wg-search-foot-help">
              {!stale && (
                <span>
                  <b>↑↓ (arrows)</b> navigate
                </span>
              )}
              <span>
                <b>↵ (enter)</b> {stale ? 'search' : 'add to graph'}
              </span>
              <span>
                <b>esc</b> dismiss
              </span>
            </div>

            <div>
              {status === 'loading' && <SpinnerIcon size={14} />}
              {!stale && status === 'done' && (
                <span className="wg-search-count">
                  {titles.length} {titles.length === 1 ? 'result' : 'results'}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* {open &&
        <>
          <div>
            {stale && <div className="wg-results">
              {status === 'error' && (
                <div className="wg-result wg-result--empty">{error}</div>
              )}

              {status === 'loading' && mode === 'search' && <div>
                </div>
              }

              {status === 'done' && mode === 'search' && <div>
                </div>
              }
              {status === 'done' && mode === 'link' && <div>
                </div>
              }
            </div>}
            <div className="wg-search-foot" results-shown={`${!stale}`}>
              <div className="wg-search-foot-help">
                {!stale && (
                  <span>
                    <b>↑↓ (arrows)</b> navigate
                  </span>
                )}

                <span>
                  <b>↵ (enter)</b> {stale ? 'search' : 'add to graph'}
                </span>
                <span>
                  <b>esc</b> dismiss
                </span>
              </div>

              <div>
                {status === 'loading' && <SpinnerIcon size={14} />}
                {!stale && status === 'done' && (
                  <span className="wg-search-count">
                    {titles.length} {titles.length === 1 ? 'result' : 'results'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      } */}

      {/* {open && mode === 'search' && (
        <>
          <div className="wg-results" id={listId} role="listbox">
            {!stale && status === 'error' && (
              <div className="wg-result wg-result--empty">error {error}</div>
            )}
            {!stale && status === 'done' && titles.length === 0 && (
              <div className="wg-result wg-result--empty">
                No matching articles.
              </div>
            )}
            {!stale &&
              titles.map((title, i) => (
                <button
                  key={title}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className="wg-result"
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void pick(title)}
                >
                  <span style={{ flex: 1 }}>{titleTransform(title)}</span>
                  {i === active && <span className="ret">↵</span>}
                </button>
              ))}
          </div>
          <div className="wg-search-foot">
            <div className="wg-search-foot-help">
              {!stale && (
                <span>
                  <b>↑↓ (arrows)</b> navigate
                </span>
              )}
              <span>
                <b>↵ (enter)</b> {stale ? 'search' : 'add to graph'}
              </span>
              <span>
                <b>esc</b> dismiss
              </span>
            </div>
            
            <div>
              {status === 'loading' && <SpinnerIcon size={14} />}
              {!stale && status === 'done' && (
                <span className="wg-search-count">
                  {titles.length} {titles.length === 1 ? 'result' : 'results'}
                </span>
              )}
            </div>
          </div>
        </>
      )} */}

    </div >
  )
}
