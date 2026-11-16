export interface GraphNode {
    /** Canonical title, also the node id. */
    id: string;
    title: string;
    /** True total number of outbound links (from the API `count` field). */
    outboundCount: number;
    /** Outbound link titles we currently know — capped at 20 unless `allLinksLoaded`. */
    links: string[];
    allLinksLoaded: boolean;
}

export type EdgeKind = "directed" | "mutual";

export interface GraphEdge {
    key: string;
    source: string;
    target: string;
    kind: EdgeKind;
}

/** Node circle radius as a function of outbound-link count. */
export const nodeRadius = (outboundCount: number): number =>
    Math.max(9, Math.min(30, 7 + Math.sqrt(outboundCount) * 2.6));
