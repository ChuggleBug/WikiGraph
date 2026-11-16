export function Legend() {
    return (
        <div className="wg-legend">
            <span>
                <svg width="46" height="18" aria-hidden="true">
                    <circle cx="7" cy="9" r="4" fill="#2b2620" />
                    <circle cx="30" cy="9" r="8" fill="#2b2620" />
                </svg>
                node size = outbound links
            </span>
            <span>
                <svg width="30" height="10" aria-hidden="true">
                    <line
                        className="wg-edge--directed"
                        x1="1"
                        y1="5"
                        x2="29"
                        y2="5"
                    />
                </svg>
                links to
            </span>
            <span>
                <svg width="30" height="10" aria-hidden="true">
                    <line
                        className="wg-edge--mutual"
                        x1="1"
                        y1="5"
                        x2="29"
                        y2="5"
                    />
                </svg>
                mutual
            </span>
        </div>
    );
}
