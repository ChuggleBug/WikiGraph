import { useEffect, useRef, useState } from "react";
import { FitIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons";

export interface ViewControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onClear: () => void;
    canClear: boolean;
}

export function ViewControls({
    onZoomIn,
    onZoomOut,
    onReset,
    onClear,
    canClear,
}: ViewControlsProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
            }
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    return (
        <div className="wg-controls" ref={containerRef}>
            {/* Debut toggle */}
            {/* <button style={{position: 'fixed', left: '5px', top: '5px'}} onClick={() => setOpen((prev) => !prev)}>
        Toggle: {`${open}`}
      </button> */}

            {/* Main control panel */}
            <div className="wg-panel wg-controls-main">
                <button
                    className="wg-icbtn"
                    onClick={onZoomIn}
                    aria-label="Zoom in"
                >
                    <PlusIcon size={18} />
                </button>
                <button
                    className="wg-icbtn"
                    onClick={onZoomOut}
                    aria-label="Zoom out"
                >
                    <MinusIcon />
                </button>
                <button
                    className="wg-icbtn"
                    onClick={onReset}
                    aria-label="Reset view"
                >
                    <FitIcon />
                </button>
                <div className="sep" />
                <button
                    className={`wg-icbtn wg-icbtn--danger ${open ? "wg-icbtn--hovered" : ""}`}
                    onClick={() => setOpen((prev) => !prev)}
                    disabled={!canClear}
                    aria-label="Clear canvas"
                >
                    <TrashIcon />
                </button>
            </div>
            {/* Conditional display */}
            <div
                className={`wg-panel wg-controls-popup ${open ? "wg-controls-popup--open" : ""}`}
            >
                Delete all nodes?
                <div className="wg-controls-btns">
                    <button className="wg-btn" onClick={() => setOpen(false)}>
                        <span>Cancel</span>
                    </button>
                    <button
                        className="wg-btn-alt"
                        onClick={() => {
                            setOpen(false);
                            onClear();
                        }}
                    >
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
