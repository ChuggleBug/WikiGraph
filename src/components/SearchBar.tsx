import React, { useId, useRef, useState } from "react";
import { ApiError, searchTitles, type SearchElement } from "../api";
import { PathIcon, SpinnerIcon } from "./icons";
import titleTransform, { textTrim } from "../titleTransform";
import { FaLongArrowAltLeft, FaSearch } from "react-icons/fa";

export type NavSearchState = "search" | "results" | "always";

export interface NavHint {
    on: ReadonlyArray<NavSearchState> | NavSearchState;
    symbol: string;
    hint: string;
}

export interface SearchBarProps {
    /** Resolves to whether the title was actually added (false if the API doesn't track it). */
    onPick: (title: string) => Promise<boolean>;
    placeholder: string;
    pathMode: boolean;
    navHints?: ReadonlyArray<NavHint>;
    stickyResults?: boolean;
}

type Status = "idle" | "loading" | "done" | "error";

/** Parses a Wikipedia article URL's `/wiki/<title>` segment, dropping any `#fragment`. */
function parseWikipediaUrl(value: string): string | null {
    const match = value.match(/\/wiki\/([^#?]+)/);
    if (!match) {
        return null;
    }
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

export function SearchBar({
    onPick,
    placeholder,
    pathMode,
    navHints = [],
    stickyResults = false,
}: SearchBarProps) {
    // State of the search bar itself
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [status, setStatus] = useState<Status>("idle");

    // Current value inside of text input
    const [query, setQuery] = useState("");
    const trimmed = query.trim();
    const [searchedQuery, setSearchedQuery] = useState<string | null>(null);

    const [searchResults, setSearchResults] = useState<SearchElement[]>([]);
    const [error, setError] = useState("");
    const [active, setActive] = useState(0);
    const listId = useId();
    const helpId = useId();

    const [prevPlaceholder, setPrevPlaceholder] = useState(placeholder);

    // Clear query on new placeholder
    if (placeholder !== prevPlaceholder) {
        setPrevPlaceholder(placeholder);
        setQuery("");
    }

    const changeQuery = (value: string) => {
        setQuery(value);
        setSearchResults([]);
        setStatus("idle");
        setSearchedQuery(null);
    };

    const runSearch = async (title: string) => {
        if (!title) {
            return;
        }
        setStatus("loading");
        setSearchedQuery(title);
        try {
            const res = await searchTitles(title);
            if (res.titles.length === 0) {
                setError("No results");
                setStatus("error");
            } else {
                setSearchResults(res.titles);
                setActive(0);
                setStatus("done");
            }
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Search failed");
            setStatus("error");
        }
    };

    // Is there any text inside of the search bar
    const open = focused && trimmed.length > 0;

    // Input text was changed after search
    const stale = searchedQuery !== trimmed;

    // Any changes made to search bar after submission
    const submissionChanged = open && !stale && status !== "idle";

    const pickTitle = async (title: string) => {
        setStatus("loading");
        const added = await onPick(title);
        if (added) {
            setQuery("");
            setSearchResults([]);
            setStatus("idle");
            setSearchedQuery(null);
            inputRef.current?.blur();
        } else {
            setError("Failed to add article");
            setStatus("error");
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            inputRef.current?.blur();
        } else if (e.key === "Enter") {
            e.preventDefault();
            const urlParsed = parseWikipediaUrl(trimmed);
            if (urlParsed) {
                // Try to add immediately
                void pickTitle(urlParsed);
                return;
            }

            // Treat input as a regular search query
            if (searchedQuery === trimmed && status !== "loading") {
                if (searchResults[active]) {
                    void pickTitle(searchResults.map((e) => e.title)[active]);
                }
            } else {
                // Need to get a selection of titles
                void runSearch(trimmed);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, searchResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        }
    };

    return (
        <div className={`wg-panel wg-search ${open ? "wg-search--open" : ""}`}>
            {/* Debug block showing internal state */}
            {/* <div
                style={{
                    position: "fixed",
                    zIndex: "50",
                    display: "flex",
                    gap: "5",
                    flexDirection: "column",
                    right: "50px",
                }}
            >
                <span>query: {query}</span>
                <span>focused: {focused ? "true" : "false"}</span>
                <span>status: {status}</span>
                <span>error: {error}</span>
                <span>active: {active}</span>
                <span>searchedQuery: {searchedQuery}</span>
                <span>trimmed: {trimmed}</span>
                <span>open: {open ? "true" : "false"}</span>
                <span>stale: {stale ? "true" : "false"}</span>
                <span>
                    submissionChanged: {submissionChanged ? "true" : "false"}
                </span>
            </div> */}

            {/* Top Search Bar segment */}
            <div
                className="wg-search-input"
                onMouseDown={(e) => {
                    if (!(e.target as HTMLElement).closest("button, input")) {
                        e.preventDefault();
                        inputRef.current?.focus();
                    }
                }}
            >
                <div className="wg-search-field">
                    {/* Input text box */}
                    {pathMode ? <PathIcon size={16} /> : <FaSearch size={16} />}
                    {/* manually set to 16px to prevent zoom in */}
                    <input
                        style={{ fontSize: 16 }}
                        name="search bar"
                        ref={inputRef}
                        value={query}
                        onChange={(e) => changeQuery(e.target.value)}
                        onFocus={() => {
                            if (blurTimeoutRef.current !== null) {
                                clearTimeout(blurTimeoutRef.current);
                                blurTimeoutRef.current = null;
                            }
                            setFocused(true);
                        }}
                        onBlur={() => {
                            blurTimeoutRef.current = setTimeout(() => {
                                blurTimeoutRef.current = null;
                                setFocused(false);
                            }, 10);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        aria-expanded={open}
                        aria-controls={listId}
                        aria-autocomplete="list"
                    />
                </div>

                <div className="wg-search-status">
                    {status === "loading" && <SpinnerIcon size={14} />}
                    {!stale && status === "done" && (
                        <span className="wg-search-count">
                            {searchResults.length}{" "}
                            {searchResults.length === 1 ? "result" : "results"}
                        </span>
                    )}
                </div>
            </div>

            {(focused || (searchResults.length > 0 && stickyResults)) && (
                <>
                    <div className="wg-results" id={listId} role="listbox">
                        {!stale && status === "error" && (
                            <div className="wg-result wg-result--empty">
                                {error}
                            </div>
                        )}
                        {!stale &&
                            status === "done" &&
                            searchResults.length === 0 && (
                                <div className="wg-result wg-result--empty">
                                    No matching articles.
                                </div>
                            )}
                        {!stale &&
                            status !== "error" &&
                            searchResults.map((e, i) => {
                                const isRedirect = e.type == "redirect";

                                const redirectString = isRedirect
                                    ? e.redirects
                                          .map((e) => titleTransform(e))
                                          .join(", ")
                                    : "";

                                // Heuristic value
                                const TOTAL_LENGTH = 50;

                                // Number of characters needed for the title
                                // capped at 2/3 of the total length
                                const titleMax = Math.min(
                                    TOTAL_LENGTH * (isRedirect ? 0.66 : 1),
                                    e.title.length,
                                );

                                // It can take up the rest of the space
                                const redirectMax = TOTAL_LENGTH - titleMax;

                                return (
                                    <button
                                        key={e.title}
                                        className="wg-result"
                                        type="button"
                                        role="option"
                                        aria-selected={i === active}
                                        title={titleTransform(e.title)}
                                        onMouseEnter={() => setActive(i)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => void pickTitle(e.title)}
                                    >
                                        <div className="wg-result-body">
                                            <div className="wg-result-title">
                                                <span className="wg-result-name">
                                                    {titleTransform(e.title, {
                                                        trim: true,
                                                        count: titleMax,
                                                    })}
                                                </span>
                                                {e.type == "redirect" && (
                                                    <div className="wg-result-title-redirect">
                                                        <FaLongArrowAltLeft />
                                                        {/* Sum  */}
                                                        {textTrim(
                                                            redirectString,
                                                            {
                                                                count: redirectMax,
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {i === active && (
                                            <span className="ret">↵</span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>

                    {navHints.length > 0 && (
                        <div
                            className="wg-search-foot"
                            results-shown={`${submissionChanged}`}
                        >
                            <div className="wg-search-foot-help">
                                {navHints
                                    .filter((h) => {
                                        return (
                                            Array.isArray(h.on) ? h.on : [h.on]
                                        ).some((on) => {
                                            switch (on) {
                                                case "always":
                                                    return true;
                                                case "search":
                                                    return (
                                                        stale &&
                                                        status !== "error"
                                                    );
                                                case "results":
                                                    return (
                                                        searchResults.length !=
                                                        0
                                                    );
                                            }
                                        });
                                    })
                                    .map((h) => {
                                        return (
                                            <span key={helpId}>
                                                <b>{h.symbol}</b> {h.hint}
                                            </span>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
