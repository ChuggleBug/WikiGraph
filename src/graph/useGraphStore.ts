import { useCallback, useMemo, useReducer } from "react";
import type { GraphEdge, GraphNode } from "../types";

/**
 * Structural edge rule (same for search-add and dropdown-add): between any two
 * nodes on the canvas, draw an edge wherever one links to the other — directed
 * if one-way, mutual if both link. Recomputed from node link data on every change.
 */
function computeEdges(nodes: GraphNode[]): GraphEdge[] {
    const linkSets = new Map(nodes.map((n) => [n.id, new Set(n.links)]));
    const edges: GraphEdge[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i].id;
            const b = nodes[j].id;
            const aToB = linkSets.get(a)!.has(b);
            const bToA = linkSets.get(b)!.has(a);
            if (aToB && bToA) {
                edges.push({
                    key: `${a} ${b}`,
                    source: a,
                    target: b,
                    kind: "mutual",
                });
            } else if (aToB) {
                edges.push({
                    key: `${a} ${b}`,
                    source: a,
                    target: b,
                    kind: "directed",
                });
            } else if (bToA) {
                edges.push({
                    key: `${a} ${b}`,
                    source: b,
                    target: a,
                    kind: "directed",
                });
            }
        }
    }
    return edges;
}

export interface GraphState {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedId: string | null;
}

interface ArticlePayload {
    title: string;
    count: number;
    links: string[];
    allLinksLoaded?: boolean;
}

type Action =
    | { type: "add"; article: ArticlePayload; select?: boolean }
    | { type: "setLinks"; article: ArticlePayload }
    | { type: "select"; title: string | null }
    | { type: "delete"; title: string | null }
    | { type: "closePanel" }
    | { type: "clear" };

function upsert(nodes: GraphNode[], article: ArticlePayload): GraphNode[] {
    const next: GraphNode = {
        id: article.title,
        title: article.title,
        outboundCount: article.count,
        links: article.links,
        allLinksLoaded: article.allLinksLoaded ?? false,
    };
    const idx = nodes.findIndex((n) => n.id === article.title);
    if (idx === -1) {
        return [...nodes, next];
    }
    const merged = nodes.slice();
    merged[idx] = { ...merged[idx], ...next };
    return merged;
}

function reducer(state: GraphState, action: Action): GraphState {
    function reducer_wrap() {
        switch (action.type) {
            case "add": {
                const nodes = upsert(state.nodes, action.article);
                return {
                    nodes,
                    edges: computeEdges(nodes),
                    selectedId: action.select
                        ? action.article.title
                        : state.selectedId,
                };
            }
            case "setLinks": {
                if (!state.nodes.some((n) => n.id === action.article.title)) {
                    return state;
                }
                const nodes = upsert(state.nodes, action.article);
                return { ...state, nodes, edges: computeEdges(nodes) };
            }
            case "select":
                return { ...state, selectedId: action.title };
            case "closePanel":
                return { ...state, selectedId: null };
            case "clear":
                return { nodes: [], edges: [], selectedId: null };
            case "delete":
                if (action.title === null) {
                    return state;
                }
                return { ...removeNode(state, action.title), selectedId: null };
            default:
                return state;
        }
    }

    const s = reducer_wrap();
    setLocalStorage(s);
    return s;
}

function removeNode(state: GraphState, nodeId: string): GraphState {
    return {
        nodes: state.nodes.filter((n) => n.id !== nodeId),
        edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId,
        ),
        selectedId: state.selectedId,
    };
}

function getLocalStorage() {
    const local = localStorage["wg_state"];
    return local ? JSON.parse(local) : EMPTY;
}

function setLocalStorage(state: GraphState) {
    localStorage["wg_state"] = JSON.stringify({
        ...state,
        selectedId: null,
    });
}

const EMPTY: GraphState = { nodes: [], edges: [], selectedId: null };

export function useGraphStore() {
    const [state, dispatch] = useReducer(reducer, undefined, () =>
        getLocalStorage(),
    );

    const addArticle = useCallback(
        (article: ArticlePayload, select = true) =>
            dispatch({ type: "add", article, select }),
        [],
    );
    const setArticleLinks = useCallback(
        (article: ArticlePayload) => dispatch({ type: "setLinks", article }),
        [],
    );
    const selectNode = useCallback(
        (title: string | null) => dispatch({ type: "select", title }),
        [],
    );
    const deleteNode = useCallback(
        (title: string | null) => dispatch({ type: "delete", title }),
        [],
    );
    const closePanel = useCallback(() => dispatch({ type: "closePanel" }), []);
    const clear = useCallback(() => dispatch({ type: "clear" }), []);

    const selectedNode = useMemo(
        () => state.nodes.find((n) => n.id === state.selectedId) ?? null,
        [state.nodes, state.selectedId],
    );
    const nodeIds = useMemo(
        () => new Set(state.nodes.map((n) => n.id)),
        [state.nodes],
    );

    return {
        ...state,
        selectedNode,
        nodeIds,
        addArticle,
        setArticleLinks,
        select: selectNode,
        delete: deleteNode,
        closePanel,
        clear,
    };
}
