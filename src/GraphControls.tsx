import { FaSearch } from "react-icons/fa";
import { DetailPanel, type DetailPanelProps } from "./components/DetailPanel";
import MobileContentPopup from "./components/MobileContentPopup";
import { SearchBar, type SearchBarProps } from "./components/SearchBar";
import type { GraphNode } from "./types";

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

export default function GraphControls({
    isMobile,
    detailPanel,
    searchBar,
    mobilePopup,
}: GraphControlsProps) {
    const { node, ...detailPanelRest } = detailPanel;
    const { navHints, stickyResults, ...searchBarRest } = searchBar;

    return (
        <>
            {node && <DetailPanel {...detailPanelRest} node={node} />}

            {/* Search bars make the new node selected */}
            {!isMobile ? (
                <div className="wg-search-desktop-wrapper">
                    <SearchBar {...searchBarRest} navHints={navHints} />
                </div>
            ) : (
                <MobileContentPopup
                    displayText="Search"
                    open={mobilePopup.open}
                    onClose={mobilePopup.onClose}
                >
                    <SearchBar
                        {...searchBarRest}
                        stickyResults={stickyResults}
                    />
                </MobileContentPopup>
            )}

            {isMobile && (
                <button
                    className="wg-panel wg-search-fab"
                    onClick={mobilePopup.onOpen}
                    aria-label="Search"
                >
                    <span className="wg-icbtn">
                        <FaSearch size={16} />
                    </span>
                </button>
            )}
        </>
    );
}
