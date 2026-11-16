/**
 * Client for the WikiGraph backend (see API.md). Same-origin under `/api/wikigraph`;
 * override with VITE_API_BASE for a split deployment.
 */
const BASE = import.meta.env.VITE_API_BASE || '/wikigraph'

export class ApiError extends Error { }

async function getJson<T>(
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  const qs = new URLSearchParams(params).toString()
  let res: Response
  try {
    res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, {
      signal: signal ?? AbortSignal.timeout(5000),
      headers: { accept: 'application/json' },
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('Could not reach server')
  }
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null
  if (!res.ok || !data || data.error) {
    throw new ApiError(data?.error ?? `Request failed (${res.status})`)
  }
  return data
}

export interface HealthResponse {
  staus: string
}

export interface ShortestPathResponse {
  toTitle: string
  fromTitle: string
  count: number
  path: ReadonlyArray<string>
}

export interface OutboundLinksResponse {
  title: string
  count: string
  links: ReadonlyArray<string>
}

export const PAGE_TYPES = ['page', 'redirect'] as const
export type PageType = (typeof PAGE_TYPES)[number]

interface SearchElementBase<T extends PageType> {
  type: T
  title: string
}

export interface PageSearchElement extends SearchElementBase<'page'> {
  redirects: ReadonlyArray<string>
}

export interface RedirectSearchElement extends SearchElementBase<'redirect'> {
  redirects?: ReadonlyArray<string> | null
}

export type SearchElement = PageSearchElement | RedirectSearchElement

// Compile-time check: every PageType has a SearchElement variant and vice versa.
type _Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
const _searchElementCoversPageType: _Same<PageType, SearchElement['type']> = true
void _searchElementCoversPageType

export function isPageElement(el: SearchElement): el is PageSearchElement {
  return el.type === 'page'
}

export function isRedirectElement(el: SearchElement): el is RedirectSearchElement {
  return el.type === 'redirect'
}

/** `redirects` normalized to an array regardless of variant. */
export function redirectsOf(el: SearchElement): ReadonlyArray<string> {
  return el.redirects ?? []
}

export interface SearchTitlesResponse {
  name: string
  count: number
  titles: ReadonlyArray<SearchElement>
}

export interface SearchResult {
  name: string
  count: number
  titles: string[]
}

/** "Did you mean" title lookup for a free-form user query. */
export function searchTitles(
  name: string,
  signal?: AbortSignal,
): Promise<SearchResult> {
  return getJson<SearchResult>('/search', { name }, signal)
}

export interface LinksResult {
  title: string
  count: number
  links: string[]
}

/**
 * Outbound links for a canonical title, popularity-ordered.
 * `all` false (default) caps `links` at 20; `count` is always the true total.
 */
export function fetchLinks(
  title: string,
  all = true,
  signal?: AbortSignal,
): Promise<LinksResult> {
  return getJson<LinksResult>('/links', { title, all: String(all) }, signal)
}

/** Server health check. */
export async function checkStatus(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(BASE, { signal })
    return res.ok
  } catch {
    return false
  }
}
