/** Small stroke-based icon set, sized via the `size` prop. */
interface IconProps {
    size?: number;
}

const base = (size: number) => ({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
});

export const SearchIcon = ({ size = 17 }: IconProps) => (
    <svg {...base(size)} strokeWidth={2}>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

export const CloseIcon = ({ size = 15 }: IconProps) => (
    <svg {...base(size)} strokeWidth={2.2}>
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
);

export const ChevronDownIcon = ({ size = 12 }: IconProps) => (
    <svg {...base(size)} strokeWidth={2.4}>
        <path d="M6 9 L12 15 L18 9" />
    </svg>
);

export const CheckIcon = ({ size = 12 }: IconProps) => (
    <svg {...base(size)} strokeWidth={3}>
        <path d="M20 6 L9 17 L4 12" />
    </svg>
);

export const PlusIcon = ({ size = 12 }: IconProps) => (
    <svg {...base(size)} strokeWidth={2.6}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export const MinusIcon = ({ size = 18 }: IconProps) => (
    <svg {...base(size)} strokeWidth={2}>
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export const FitIcon = ({ size = 17 }: IconProps) => (
    <svg {...base(size)} strokeWidth={2}>
        <path d="M8 3 H5 a2 2 0 0 0-2 2 V8 M16 3 h3 a2 2 0 0 1 2 2 v3 M21 16 v3 a2 2 0 0 1-2 2 h-3 M3 16 v3 a2 2 0 0 0 2 2 h3" />
    </svg>
);

export const TrashIcon = ({ size = 17 }: IconProps) => (
    <svg {...base(size)} strokeWidth={2}>
        <path d="M3 6 h18 M8 6 V4 a2 2 0 0 1 2-2 h4 a2 2 0 0 1 2 2 v2 M6 6 l1 14 a2 2 0 0 0 2 2 h6 a2 2 0 0 0 2-2 l1-14" />
    </svg>
);

export const ExternalIcon = ({ size = 13 }: IconProps) => (
    <svg {...base(size)} strokeWidth={2.2}>
        <path d="M7 17 L17 7" />
        <path d="M8 7 h9 v9" />
    </svg>
);

export const ArrowRightIcon = ({ size = 14 }: IconProps) => (
    <svg {...base(size)} strokeWidth={2.2}>
        <line x1="4" y1="12" x2="20" y2="12" />
        <path d="M14 6 L20 12 L14 18" />
    </svg>
);

export const SpinnerIcon = ({ size = 13 }: IconProps) => (
    <svg
        {...base(size)}
        strokeWidth={2.4}
        style={{
            animation: "wg-spin 0.7s linear infinite",
            transformOrigin: "center",
        }}
    >
        <path d="M12 3 a9 9 0 0 1 9 9" />
        <style>{`@keyframes wg-spin{to{transform:rotate(360deg)}}`}</style>
    </svg>
);
