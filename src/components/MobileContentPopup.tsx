import type React from "react";
import CloseIcon from "@mui/icons-material/CloseRounded";

export type MobileContentPopupProps = {
    displayText: string;
    children: React.ReactNode;
    open: boolean;
    onClose: () => void;
};

export default function MobileContentPopup({
    displayText,
    children,
    open,
    onClose,
}: MobileContentPopupProps) {
    return (
        <div>
            <div
                className={`wg-mobile-popup-backdrop ${open ? "wg-mobile-popup-backdrop--open" : " "}`}
                onClick={onClose}
            />
            <div
                className={`wg-panel wg-mobile-popup ${open ? "wg-mobile-popup--open" : ""}`}
            >
                <div>
                    <h2>{displayText}</h2>
                    <button
                        className="wg-dp-close-btn"
                        onClick={onClose}
                        aria-label="Close panel"
                    >
                        <CloseIcon sx={{ fontSize: 24 }} />
                    </button>
                </div>
                <div className="wg-divider" />
                {children}
            </div>
        </div>
    );
}
