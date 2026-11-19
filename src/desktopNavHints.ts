import type { NavHint } from "./components/SearchBar";

export const NAV_HINTS: ReadonlyArray<NavHint> = [
    {
        on: "search",
        symbol: "↵ (enter)",
        hint: "search",
    },
    {
        on: "results",
        symbol: "↵ (enter)",
        hint: "add to graph",
    },
    {
        on: "results",
        symbol: "↑↓ (arrows)",
        hint: "navigate",
    },
    {
        on: "always",
        symbol: "(esc)",
        hint: "dismiss",
    },
];

export default NAV_HINTS;
