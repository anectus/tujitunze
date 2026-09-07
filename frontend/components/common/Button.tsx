"use client";

import Link from "next/link";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

interface LinkButtonProps extends BaseProps {
  href: string;
  onClick?: () => void;
}

interface ActionButtonProps extends BaseProps {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

type ButtonProps = LinkButtonProps | ActionButtonProps;

// Shared CTA treatment, lifted from the public Hero's "Become a Member" /
// "Partner With Us" buttons (components/home/Hero.tsx) so the
// authenticated app's own primary actions (e.g. "Make a Contribution",
// "Mark all as read") share the same pill shape, shadow-lift hover, and
// emerald brand color instead of each page inventing its own plain text
// link. Rounded-full is deliberately reserved for real actions like
// these — list-style navigation (Sidebar, breadcrumbs) keeps its own
// flatter rounded-lg treatment, which is the right convention for a
// vertical nav list, not an oversight to "fix" into pills too.
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-all duration-200 ease-in-out hover:-translate-y-0.5 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 " +
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0";

// Shadow lives per-variant (not in BASE) since the public Hero's
// secondary "Partner With Us" button is a plain outline with no shadow —
// only the solid primary CTA gets the shadow-lift treatment.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-[#064E3B] text-white shadow-md hover:bg-emerald-800 hover:shadow-lg",
  secondary: "border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  ...rest
}: ButtonProps) {
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} onClick={rest.onClick}>
        {children}
      </Link>
    );
  }

  const { onClick, type = "button", disabled } = rest as ActionButtonProps;

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
