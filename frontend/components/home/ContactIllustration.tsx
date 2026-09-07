// Decorative illustration for the Contact page hero — envelope, phone,
// shield, and map pin, distinct from Hero.tsx/AboutIllustration.tsx's
// compositions. Purely decorative — aria-hidden, no content a screen
// reader needs.
export default function ContactIllustration() {
  return (
    <svg viewBox="0 0 480 420" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="contact-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <path
        d="M0 340 C 90 300, 180 310, 260 330 C 350 352, 430 320, 480 300 L 480 420 L 0 420 Z"
        fill="url(#contact-ground)"
        opacity="0.9"
      />

      {/* Shield — glow pulse, reuses the shared keyframes */}
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

      {/* Envelope */}
      <g className="[animation:float-slow_4.5s_ease-in-out_infinite] motion-reduce:[animation:none]">
        <g transform="translate(90 200)">
          <rect x="0" y="0" width="140" height="94" rx="10" fill="#ffffff" stroke="#059669" strokeWidth="4" />
          <path d="M4 6 L70 56 L136 6" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* Phone */}
      <g className="[animation:float-slower_5s_ease-in-out_infinite] motion-reduce:[animation:none]">
        <g transform="translate(300 160) rotate(8)">
          <rect x="0" y="0" width="88" height="170" rx="16" fill="#1e293b" />
          <rect x="8" y="14" width="72" height="142" rx="6" fill="#F8FAFC" />
          <circle cx="44" cy="90" r="22" fill="#DCFCE7" />
          <path d="M35 90 a9 9 0 0 1 18 0 c0 5 -4 6 -4 10 h-10 c0 -4 -4 -5 -4 -10Z" fill="#059669" />
        </g>
      </g>

      {/* Map pin */}
      <g className="[animation:float-slow_4s_ease-in-out_infinite] motion-reduce:[animation:none]">
        <g transform="translate(210 250)">
          <path
            d="M28 0 C43 0 56 12 56 28 C56 48 28 74 28 74 C28 74 0 48 0 28 C0 12 13 0 28 0 Z"
            fill="#FB7185"
          />
          <circle cx="28" cy="27" r="11" fill="#ffffff" />
        </g>
      </g>
    </svg>
  );
}
