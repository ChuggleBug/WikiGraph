export function Legend() {
  return (
    <div className="wg-legend">
      <span>
        <svg width="46" height="18" aria-hidden="true">
          <circle cx="7" cy="9" r="4" fill="#2b2620" />
          <circle cx="30" cy="9" r="8" fill="#2b2620" />
        </svg>
        node size · outbound links
      </span>
      <span>
        <svg width="30" height="10" aria-hidden="true">
          <line
            x1="1"
            y1="5"
            x2="29"
            y2="5"
            stroke="#cabd9f"
            strokeWidth="1.3"
            strokeDasharray="0.1 5"
            strokeLinecap="round"
          />
        </svg>
        links to
      </span>
      <span>
        <svg width="30" height="10" aria-hidden="true">
          <line x1="1" y1="5" x2="29" y2="5" stroke="#c9bda6" strokeWidth="1.4" />
        </svg>
        mutual
      </span>
    </div>
  )
}
