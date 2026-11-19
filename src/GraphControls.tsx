import { FaSearch } from "react-icons/fa";
import { DetailPanel, type DetailPanelProps } from "./components/DetailPanel";
import { NodeIcon } from "./components/icons";
import MobileContentPopup from "./components/MobileContentPopup";
import { SearchBar, type SearchBarProps } from "./components/SearchBar";
import type { GraphNode } from "./types";
import titleTransform from "./titleTransform";
import { useRef } from "react";

export type GraphControlsProps = {
    isMobile: boolean;
    // Node can be null here, and is checked by the real DetailPanel
    detailPanel: Omit<DetailPanelProps, "node"> & { node: GraphNode | null };
    searchBar: SearchBarProps;
    mobilePopup: {
        open: boolean;
        onOpen: () => void;
        onClose: () => void;
    };
};

type PopupContent = "search" | "details";

export default function GraphControls({
    isMobile,
    detailPanel,
    searchBar,
    mobilePopup,
}: GraphControlsProps) {
    const {
        open: dpOpen,
        node,
        onAdd,
        onClose: dpOnClose,
        onDelete,
        onSelectExisting,
        onPathModeToggle,
        ...detailPanelRest
    } = detailPanel;
    const { navHints, onPick, stickyResults, ...searchBarRest } = searchBar;

    let contentType: PopupContent = "search";
    if (detailPanel.open) {
        contentType = "details";
    }

    let popupChild;
    let popUpText;
    switch (contentType) {
        case "search": {
            popUpText = "Search";
            popupChild = (
                <SearchBar
                    {...searchBarRest}
                    onPick={async (t) => {
                        const ok = await onPick(t);
                        if (ok) {
                            mobilePopup.onOpen();
                        }
                        return ok;
                    }}
                    stickyResults={stickyResults}
                />
            );
            break;
        }
        case "details": {
            // DetailPanel.open ensures node is not null
            popUpText = titleTransform(node!.title);
            popupChild = (
                <DetailPanel
                    open={dpOpen}
                    {...detailPanelRest}
                    node={node!}
                    onAdd={(t) => {
                        onAdd(t);
                        mobilePopup.onClose();
                    }}
                    onClose={() => {
                        dpOnClose();
                        mobilePopup.onClose();
                    }}
                    onSelectExisting={(t) => {
                        onSelectExisting(t);
                        mobilePopup.onClose();
                    }}
                    onPathModeToggle={() => {
                        onPathModeToggle();
                        mobilePopup.onClose();
                    }}
                    onDelete={(t) => {
                        onDelete(t);
                        mobilePopup.onClose();
                    }}
                    addTitle={false}
                />
            );
            break;
        }
    }

    const panelRef = useRef<HTMLDivElement>(null);

    return (
        <>
            {/* Search bars make the new node selected */}
            {!isMobile ? (
                <>
                    <div className="wg-search-desktop-wrapper">
                        <SearchBar
                            {...searchBar}
                        />
                    </div>
                    {node && (
                        <div
                            ref={panelRef}
                            className={`wg-panel wg-dp ${dpOpen ? "wg-dp--open" : ""}`}
                        >
                            <DetailPanel {...detailPanel} node={node} />
                        </div>
                    )}
                </>
            ) : (
                <MobileContentPopup
                    displayText={popUpText}
                    open={mobilePopup.open}
                    onClose={mobilePopup.onClose}
                >
                    {popupChild}
                </MobileContentPopup>
            )}

            {isMobile && (
                <button
                    className="wg-panel wg-search-fab"
                    onClick={mobilePopup.onOpen}
                    aria-label={
                        contentType === "details" ? "Article details" : "Search"
                    }
                >
                    <span className="wg-icbtn">
                        {contentType === "details" ? (
                            <NodeIcon size={18} />
                        ) : (
                            <FaSearch size={16} />
                        )}
                    </span>
                </button>
            )}
        </>
    );
}
