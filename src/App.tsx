import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, checkStatus, fetchLinks } from "./api";
import { DetailPanel } from "./components/DetailPanel";
import { Legend } from "./components/Legend";
import { SearchBar } from "./components/SearchBar";
import { ViewControls } from "./components/ViewControls";
import { Wordmark } from "./components/Wordmark";
import { GraphCanvas } from "./graph/GraphCanvas";
import { useGraphStore } from "./graph/useGraphStore";
import { useView } from "./graph/useView";
import type { GraphNode } from "./types";

export default function App() {
    const store = useGraphStore();
    const { view, panBy, zoomAt, reset } = useView();

    const [pending, setPending] = useState<Set<string>>(() => new Set());
    const [loadingAll, setLoadingAll] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const toastTimer = useRef<number | undefined>(undefined);
    const [lastNode, setLastNode] = useState<GraphNode | null>(
        store.selectedNode,
    );

    useEffect(() => {
        if (store.selectedNode) {
            setLastNode(store.selectedNode);
        }
    }, [store.selectedNode]);

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

    return (
        <div className="wg-root">
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
                onBackgroundClick={store.closePanel}
            />

            {/* Search bars make the new node selected */}
            <SearchBar onPick={(t) => addTitle(t, true)} />

            {lastNode && (
                <DetailPanel
                    open={!!store.selectedNode}
                    node={lastNode}
                    nodeIds={store.nodeIds}
                    pendingTitles={pending}
                    loadingAll={loadingAll}
                    onAdd={(t) => addTitle(t, false)}
                    onDelete={store.delete}
                    onSelectExisting={store.select}
                    onLoadAll={loadAllLinks}
                    onClose={store.closePanel}
                />
            )}

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
