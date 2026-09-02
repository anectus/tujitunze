// Decorative hero graphic — a stylized flat-shape composition (shield,
// two phone mockups, coin stack, piggy bank) rather than a literal
// rendering of any reference image: hand-authored SVG can't reproduce a
// 3D/photo illustration, so this captures the same visual story and
// color palette (teal shield, green ground, gold coins) with simple
// native shapes instead. Purely decorative — aria-hidden, no content a
// screen reader would need (the headline/description carry the meaning).
export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 480 420"
      className="w-full h-auto"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <path
        d="M0 340 C 90 300, 180 310, 260 330 C 350 352, 430 320, 480 300 L 480 420 L 0 420 Z"
        fill="url(#groundGrad)"
        opacity="0.9"
      />

      {/* Ambient clouds */}
      <g fill="#E0F2FE">
        <ellipse cx="70" cy="70" rx="34" ry="16" />
        <ellipse cx="95" cy="62" rx="24" ry="14" />
        <ellipse cx="420" cy="110" rx="28" ry="13" />
        <ellipse cx="440" cy="100" rx="18" ry="11" />
      </g>

      {/* Shield */}
      <path
        d="M240 60 L302 84 C302 150 280 205 240 232 C200 205 178 150 178 84 Z"
        fill="#0d9488"
      />
      <path
        d="M240 84 L282 100 C282 148 265 187 240 208 C215 187 198 148 198 100 Z"
        fill="#14b8a6"
      />
      <g stroke="#ffffff" strokeWidth="8" strokeLinecap="round">
        <line x1="240" y1="120" x2="240" y2="164" />
        <line x1="218" y1="142" x2="262" y2="142" />
      </g>

      {/* Back phone */}
      <g transform="rotate(8 300 230)">
        <rect x="248" y="118" width="104" height="200" rx="16" fill="#0f172a" />
        <rect x="256" y="132" width="88" height="172" rx="6" fill="#F8FAFC" />
        <rect x="256" y="132" width="88" height="34" rx="6" fill="#16a34a" />
        <text x="300" y="153" textAnchor="middle" fontSize="11" fill="#ffffff" fontFamily="sans-serif" fontWeight="600">
          Health Wallet
        </text>
        <rect x="266" y="180" width="68" height="10" rx="5" fill="#D1FAE5" />
        <rect x="266" y="198" width="46" height="8" rx="4" fill="#E2E8F0" />
        <rect x="266" y="214" width="68" height="8" rx="4" fill="#E2E8F0" />
        <circle cx="318" cy="248" r="16" fill="#DCFCE7" />
        <path d="M311 248 L316 253 L326 241" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Front phone */}
      <g transform="rotate(-6 190 260)">
        <rect x="140" y="150" width="96" height="188" rx="16" fill="#1e293b" />
        <rect x="148" y="164" width="80" height="160" rx="6" fill="#F8FAFC" />
        <rect x="158" y="178" width="60" height="9" rx="4.5" fill="#CBD5E1" />
        <rect x="158" y="196" width="42" height="16" rx="8" fill="#DCFCE7" />
        <rect x="158" y="222" width="60" height="9" rx="4.5" fill="#E2E8F0" />
        <rect x="158" y="240" width="60" height="9" rx="4.5" fill="#E2E8F0" />
        <rect x="158" y="266" width="60" height="22" rx="6" fill="#16a34a" />
      </g>

      {/* Coin stack */}
      <g>
        {[0, 1, 2, 3].map((i) => (
          <ellipse
            key={i}
            cx="95"
            cy={352 - i * 14}
            rx="34"
            ry="13"
            fill={i % 2 === 0 ? "#facc15" : "#4ade80"}
            stroke={i % 2 === 0 ? "#ca8a04" : "#16a34a"}
            strokeWidth="2"
          />
        ))}
      </g>

      {/* Piggy bank */}
      <g transform="translate(330 290)">
        {/* ears */}
        <polygon points="18,-20 34,-20 26,-2" fill="#FB7185" />
        <polygon points="46,-24 62,-22 50,-4" fill="#FB7185" />
        {/* body */}
        <ellipse cx="46" cy="26" rx="52" ry="36" fill="#FDA4AF" />
        {/* snout */}
        <ellipse cx="-4" cy="30" rx="17" ry="13" fill="#FB7185" />
        <ellipse cx="-9" cy="30" rx="2.6" ry="4" fill="#9F1239" />
        <ellipse cx="0" cy="30" rx="2.6" ry="4" fill="#9F1239" />
        {/* eye */}
        <circle cx="16" cy="6" r="3.4" fill="#7C2D3C" />
        {/* tail */}
        <path d="M96 8 C106 2, 106 14, 98 14" stroke="#FB7185" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* legs */}
        {[4, 26, 66, 88].map((x, i) => (
          <rect key={i} x={x} y="56" width="10" height="16" rx="4" fill="#FB7185" />
        ))}
        {/* coin slot + coin */}
        <rect x="38" y="-12" width="16" height="4" rx="2" fill="#9F1239" />
        <circle cx="46" cy="-24" r="12" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
      </g>

      {/* Small floating accents */}
      <g fill="#5eead4">
        <rect x="40" y="150" width="14" height="14" rx="3" transform="rotate(20 47 157)" />
        <circle cx="410" cy="200" r="8" />
      </g>
    </svg>
  );
}
