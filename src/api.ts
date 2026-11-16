const BASE = "/wikigraph";

export class ApiError extends Error {}

async function getJson<T>(
    path: string,
    params: Record<string, any>,
    signal?: AbortSignal,
): Promise<T> {
    const qs = new URLSearchParams(params).toString();
    let res: Response;
    try {
        res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ""}`, {
            signal: signal ?? AbortSignal.timeout(5000),
            headers: { accept: "application/json" },
        });
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            throw err;
        }
        throw new ApiError("Could not reach server");
    }
    const data = (await res.json().catch(() => null)) as
        (T & { error?: string }) | null;
    if (!res.ok || !data || data.error) {
        throw new ApiError(data?.error ?? `Request failed (${res.status})`);
    }
    return data;
}

const HEALTH_STATUS = ["ok", "down", "unknown"] as const;
type HealthStatus = (typeof HEALTH_STATUS)[number];

export interface HealthResponse {
    status: HealthStatus;
}

export interface ShortestPathResponse {
    toTitle: string;
    fromTitle: string;
    count: number;
    path: ReadonlyArray<string>;
}

export interface OutboundLinksResponse {
    title: string;
    count: number;
    links: string[];
}

export const PAGE_TYPES = ["page", "redirect"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

interface SearchElementBase<T extends PageType> {
    type: T;
    title: string;
}

export interface PageSearchElement extends SearchElementBase<"page"> {
    redirects?: ReadonlyArray<string> | null;
}

export interface RedirectSearchElement extends SearchElementBase<"redirect"> {
    redirects: ReadonlyArray<string>;
}

export type SearchElement = PageSearchElement | RedirectSearchElement;

// Compile-time check: every PageType has a SearchElement variant and vice versa.
type _Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const _searchElementCoversPageType: _Same<PageType, SearchElement["type"]> =
    true;
void _searchElementCoversPageType;

export function isPageElement(el: SearchElement): el is PageSearchElement {
    return el.type === "page";
}

export function isRedirectElement(
    el: SearchElement,
): el is RedirectSearchElement {
    return el.type === "redirect";
}

/** `redirects` normalized to an array regardless of variant. */
export function redirectsOf(el: SearchElement): ReadonlyArray<string> {
    return el.redirects ?? [];
}

export interface SearchTitlesResponse {
    name: string;
    count: number;
    titles: SearchElement[];
}

/** "Did you mean" title lookup for a free-form user query. */
export function searchTitles(
    name: string,
    signal?: AbortSignal,
): Promise<SearchTitlesResponse> {
    return getJson<SearchTitlesResponse>(
        "/search",
        { name, redirects: true },
        signal,
    );
}

/**
 * Outbound links for a canonical title, popularity-ordered.
 * `all` false (default) caps `links` at 20; `count` is always the true total.
 */
export function fetchLinks(
    title: string,
    all = true,
    signal?: AbortSignal,
): Promise<OutboundLinksResponse> {
    return getJson<OutboundLinksResponse>(
        "/links",
        { title, all: String(all) },
        signal,
    );
}

/** Server health check. */
export async function checkStatus(signal?: AbortSignal): Promise<boolean> {
    try {
        const res = await getJson<HealthResponse>(`/health`, {}, signal);
        console.log(res);
        return res.status === "ok";
    } catch {
        return false;
    }
}

export function getShortestPath(
    from: string,
    to: string,
    signal?: AbortSignal,
): Promise<ShortestPathResponse> {
    return getJson<ShortestPathResponse>(
        "/path",
        {
            fromTitle: from,
            toTitle: to,
        },
        signal,
    );
}
