import { IconBase, type IconBaseProps } from "react-icons";

/**
 * Path icon: a route through a graph. Drawn in Font Awesome's solid style
 * (512 viewBox, filled shapes, currentColor) on react-icons' IconBase, so it
 * takes the same props as Fa* icons (size, color, title, IconContext).
 * Start and waypoint nodes are solid; the destination is a ring.
 */
export const PathIcon = (props: IconBaseProps) => (
    <IconBase attr={{ viewBox: "0 0 512 512" }} {...props}>
        <path
            d="M96 416 L224 96 L370 267"
            fill="none"
            strokeWidth="48"
            strokeLinejoin="round"
        />
        <circle cx="96" cy="416" r="72" />
        <circle cx="224" cy="96" r="72" />
        <circle cx="416" cy="320" r="60" fill="none" strokeWidth="48" />
    </IconBase>
);

/**
 * Node icon: a selected article and its links. Same Font Awesome solid style
 * as PathIcon (512 viewBox, filled shapes, currentColor, IconBase props).
 * The focal node is large and solid; its linked neighbours are smaller.
 */
export const NodeIcon = (props: IconBaseProps) => (
    <IconBase attr={{ viewBox: "0 0 512 512" }} {...props}>
        <path
            d="M240 272 L88 120 M240 272 L424 128 M240 272 L392 424"
            fill="none"
            strokeWidth="44"
            strokeLinecap="round"
        />
        <circle cx="240" cy="272" r="104" />
        <circle cx="88" cy="120" r="64" />
        <circle cx="424" cy="128" r="56" />
        <circle cx="392" cy="424" r="56" />
    </IconBase>
);
