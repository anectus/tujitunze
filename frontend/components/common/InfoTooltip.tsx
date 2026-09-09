// Self-contained hover/focus tooltip — components/ui/Tooltip.tsx is an
// unused empty stub, so this stays a small standalone component rather
// than wiring through it with an unclear future contract.
// group-focus-within makes it reachable by keyboard, not just mouse
// hover. Shared by MobileMoneyAccountForm and the Settings page's linked
// accounts list.
export default function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="flex h-4 w-4 items-center justify-center rounded-full
        border border-gray-300 text-[10px] font-semibold text-gray-500
        outline-none transition hover:border-emerald-400
        hover:text-emerald-600 focus-visible:ring-2
        focus-visible:ring-emerald-400"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10
        mb-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2
        text-xs text-white opacity-0 shadow-lg transition
        group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
