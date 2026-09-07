// Decorative illustration for the About page hero — shield, wallet,
// phone, and heart, distinct from HeroIllustration.tsx's homepage
// composition so this page doesn't feel like a literal duplicate.
// Purely decorative — aria-hidden, no content a screen reader needs.
export default function AboutIllustration() {
  return (
    <svg viewBox="0 0 480 420" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="about-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <path
        d="M0 340 C 90 300, 180 310, 260 330 C 350 352, 430 320, 480 300 L 480 420 L 0 420 Z"
        fill="url(#about-ground)"
        opacity="0.9"
      />

      {/* Shield — glow pulse, reuses the Hero's keyframes */}
      <g className="[animation:shield-glow_3s_ease-in-out_infinite] motion-reduce:[animation:none]">
        <path
          d="M240 50 L296 72 C296 132 276 182 240 206 C204 182 184 132 184 72 Z"
          fill="#065F46"
        />
        <path
          d="M240 72 L278 87 C278 130 263 165 240 184 C217 165 202 130 202 87 Z"
          fill="#10B981"
        />
        <g stroke="#ffffff" strokeWidth="7" strokeLinecap="round">
          <line x1="240" y1="106" x2="240" y2="146" />
          <line x1="220" y1="126" x2="260" y2="126" />
        </g>
      </g>

      {/* Wallet — float animation on an outer wrapper group, since a CSS
          transform animation on the same element that carries an SVG
          `transform` attribute would replace it rather than compose. */}
      <g className="[animation:float-slow_4.5s_ease-in-out_infinite] motion-reduce:[animation:none]">
        <g transform="translate(96 190)">
          <rect x="0" y="0" width="132" height="88" rx="14" fill="#0f172a" />
          <rect x="8" y="10" width="116" height="68" rx="8" fill="#ECFDF5" />
          <rect x="70" y="30" width="52" height="28" rx="8" fill="#10B981" />
          <circle cx="96" cy="44" r="7" fill="#FBBF24" />
        </g>
      </g>

      {/* Phone */}
      <g className="[animation:float-slower_5s_ease-in-out_infinite] motion-reduce:[animation:none]">
        <g transform="translate(300 150) rotate(6)">
          <rect x="0" y="0" width="92" height="176" rx="16" fill="#1e293b" />
          <rect x="8" y="14" width="76" height="148" rx="6" fill="#F8FAFC" />
          <rect x="18" y="28" width="56" height="9" rx="4.5" fill="#CBD5E1" />
          <rect x="18" y="46" width="40" height="14" rx="7" fill="#DCFCE7" />
          <rect x="18" y="70" width="56" height="9" rx="4.5" fill="#E2E8F0" />
          <rect x="18" y="88" width="56" height="9" rx="4.5" fill="#E2E8F0" />
        </g>
      </g>

      {/* Heart */}
      <g className="[animation:float-slow_4s_ease-in-out_infinite] motion-reduce:[animation:none]">
        <g transform="translate(210 250)">
          <path
            d="M30 14 C22 2 4 4 4 22 C4 38 30 54 30 54 C30 54 56 38 56 22 C56 4 38 2 30 14 Z"
            fill="#FB7185"
          />
        </g>
      </g>
    </svg>
  );
}
