"use client";

import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "none" | "search" | "decimal" | "url";
  maxLength?: number;
  optionalLabel?: string;
  error?: string;
  valid?: boolean;
  helpText?: string;
  trailing?: ReactNode;
}

// Shared field shell for the login/register forms: label + input +
// optional trailing slot (e.g. the password show/hide toggle) or a
// validity checkmark, and a help/error line that swaps to red the
// moment the field has been touched and fails validation.
export default function FormField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  optionalLabel,
  error,
  valid,
  helpText,
  trailing,
}: FormFieldProps) {
  const showCheck = !trailing && valid && !error;

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          {label}
          {optionalLabel && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              {optionalLabel}
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={!!error}
          className={`w-full rounded-lg border px-4 py-3 text-gray-900 outline-none transition ${
            trailing || showCheck ? "pr-11" : ""
          } ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-gray-300 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
          }`}
        />

        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </div>
        ) : showCheck ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#10B981]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : helpText ? (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      ) : null}
    </div>
  );
}
