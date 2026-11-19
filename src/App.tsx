import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, checkStatus, fetchLinks, getShortestPath } from "./api";
import { Legend } from "./components/Legend";
import { ViewControls } from "./components/ViewControls";
import { Wordmark } from "./components/Wordmark";
import { GraphCanvas } from "./graph/GraphCanvas";
import { useGraphStore } from "./graph/useGraphStore";
import { useView } from "./graph/useView";
import titleTransform from "./titleTransform";
import { NAV_HINTS } from "./desktopNavHints";
import { isMobile } from "react-device-detect";
import GraphControls from "./GraphControls";

export default function App() {
    const store = useGraphStore();
    const { view, panBy, zoomAt, reset } = useView();

    const [pending, setPending] = useState<Set<string>>(() => new Set());
    const [loadingAll, setLoadingAll] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const toastTimer = useRef<number | undefined>(undefined);
    const [pathMode, setPathMode] = useState(false);

    const showToast = useCallback((message: string) => {
        setToast(message);
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3800);
    }, []);

    useEffect(() => {
        checkStatus().then((ok) => {
            if (!ok) {
                showToast("The WikiGraph server is unreachable.");
            }
        });
        return () => window.clearTimeout(toastTimer.current);
    }, [showToast]);

    const addTitle = useCallback(
        async (title: string, doSelect: boolean): Promise<boolean> => {
            if (store.nodeIds.has(title)) {
                store.select(title);
                return true;
            }
            // Some thing else if being queried
            if (pending.has(title)) {
                return false;
            }
            setPending((prev) => new Set(prev).add(title));
            try {
                const { count, links } = await fetchLinks(title);
                store.addArticle({ title, count, links }, doSelect);
                return true;
            } catch (err) {
                showToast(
                    err instanceof ApiError
                        ? err.message
                        : `Couldn't add "${title}".`,
                );
                return false;
            } finally {
                setPending((prev) => {
                    const next = new Set(prev);
                    next.delete(title);
                    return next;
                });
            }
        },
        [pending, store, showToast],
    );

    const findPath = async (title: string) => {
        if (!store.selectedNode?.title) {
            return false;
        }
        // Some thing else if being queried
        if (pending.has(title)) {
            return false;
        }
        setPending((prev) => new Set(prev).add(title));
        try {
            const { path } = await getShortestPath(
                store.selectedNode.title,
                title,
            );

            // Need to add data for all paths
            // First element is always store.selectedNode.title
            // Only select on the last node
            const titleSet = new Set(store.nodes.map((n) => n.title));
            for (const t of path.slice(1, -1)) {
                if (!titleSet.has(t)) {
                    const { count, links } = await fetchLinks(t);
                    store.addArticle({ title: t, count, links }, false);
                }
            }
            // Manual check on the last node
            // Since it needs to be selected
            const lastTitle = path.at(-1);
            if (lastTitle) {
                // Dont make the API call if the node is already added
                if (!titleSet.has(lastTitle)) {
                    const { count, links } = await fetchLinks(lastTitle);
                    store.addArticle({ title: lastTitle, count, links }, true);
                } else {
                    store.select(lastTitle);
                }
            }
            return true;

            // Need to make a call for all paths
        } catch (err) {
            showToast(
                err instanceof ApiError
                    ? err.message
                    : `Failed to perform path search`,
            );
            return false;
        } finally {
            setPending((prev) => {
                const next = new Set(prev);
                next.delete(title);
                return next;
            });
        }
    };

    const loadAllLinks = useCallback(async () => {
        const node = store.selectedNode;
        if (!node || loadingAll) {
            return;
        }
        setLoadingAll(true);
        try {
            const { count, links } = await fetchLinks(node.title, true);
            store.setArticleLinks({
                title: node.title,
                count,
                links,
                allLinksLoaded: true,
            });
        } catch (err) {
            showToast(
                err instanceof ApiError
                    ? err.message
                    : "Could not load all links.",
            );
        } finally {
            setLoadingAll(false);
        }
    }, [store, loadingAll, showToast]);

    const zoomCenter = (factor: number) =>
        zoomAt(factor, window.innerWidth / 2, window.innerHeight / 2);

    const [popupOpen, setPopupOpen] = useState(false);
    const closeMobilePopup = () => {
        setPopupOpen(false);
    };

    const panelOpen = !!store.selectedNode;

    const onPick = async (title: string) => {
        // When the panel is open, then "shortest path lookup is requested"
        closeMobilePopup();
        if (panelOpen) {
            return findPath(title);
        }
        return addTitle(title, true);
    };

    let pathTruncatedTitle = titleTransform(store.selectedNode?.title ?? "", {
        trim: true,
        count: 20,
    });
    if (!pathTruncatedTitle.endsWith("...")) {
        pathTruncatedTitle += "...";
    }

    return (
        <div className="wg-root">
            <GraphControls
                isMobile={isMobile}
                mobilePopup={{
                    open: popupOpen,
                    onOpen: () => setPopupOpen(true),
                    onClose: closeMobilePopup,
                }}
                searchBar={{
                    onPick,
                    placeholder: pathMode
                        ? `Find a Path from ${pathTruncatedTitle}`
                        : "Search Wikipedia articles...",
                    pathMode,
                    navHints: NAV_HINTS,
                    stickyResults: isMobile,
                }}
                detailPanel={{
                    open: panelOpen,
                    node: store.selectedNode,
                    nodeIds: store.nodeIds,
                    pendingTitles: pending,
                    loadingAll: loadingAll,
                    onAdd: (t) => addTitle(t, false),
                    onDelete: (t) => {
                        store.delete(t);
                        setPathMode(false);
                    },
                    onSelectExisting: store.select,
                    onLoadAll: loadAllLinks,
                    onPathModeToggle: () => setPathMode((v) => !v),
                    onClose: () => {
                        store.closePanel();
                        setPathMode(false);
                    },
                }}
            />

            {/* Fixed to top left */}
            <Wordmark />

            <GraphCanvas
                nodes={store.nodes}
                edges={store.edges}
                selectedId={store.selectedId}
                view={view}
                onPanBy={panBy}
                onZoomAt={zoomAt}
                onSelectNode={store.select}
                onBackgroundClick={() => {
                    store.closePanel();
                    setPathMode(false);
                }}
            />

            <ViewControls
                onZoomIn={() => zoomCenter(1.2)}
                onZoomOut={() => zoomCenter(1 / 1.2)}
                onReset={reset}
                onClear={store.clear}
                canClear={store.nodes.length > 0}
            />
            <Legend />
            {toast && <div className="wg-toast">{toast}</div>}
        </div>
    );
}
