// Tanzanian mobile numbers: accepted as 0712345678 / 255712345678 /
// +255712345678, all identified by the same 3-digit prefix once
// normalized to local format. Mirrors
// MembersService.normalizeTanzanianPhone on the backend, but this is
// only used for the live "which network is this" hint as the member
// types — the backend re-derives and validates the real prefix itself.
export function normalizeTanzanianPhonePrefix(raw: string): string | null {
  let phoneNumber = raw.trim().replace(/\s+/g, "");

  if (phoneNumber.startsWith("+255")) {
    phoneNumber = "0" + phoneNumber.slice(4);
  } else if (phoneNumber.startsWith("255")) {
    phoneNumber = "0" + phoneNumber.slice(3);
  }

  if (phoneNumber.length < 3 || !/^0\d+$/.test(phoneNumber)) {
    return null;
  }

  return phoneNumber.slice(0, 3);
}

// Full local-format validity check (10 digits, 0-prefixed) — stricter
// than normalizeTanzanianPhonePrefix, which only needs enough digits to
// resolve an operator prefix as the member is still typing.
export function isValidTanzanianPhoneNumber(raw: string): boolean {
  let phoneNumber = raw.trim().replace(/\s+/g, "");

  if (phoneNumber.startsWith("+255")) {
    phoneNumber = "0" + phoneNumber.slice(4);
  } else if (phoneNumber.startsWith("255")) {
    phoneNumber = "0" + phoneNumber.slice(3);
  }

  return /^0\d{9}$/.test(phoneNumber);
}

export interface TelecomOperatorLookup {
  operator_id: number;
  operator_name: string;
  prefixes: string[];
}

export function detectTelecomOperator(
  phoneNumber: string,
  operators: TelecomOperatorLookup[]
): TelecomOperatorLookup | null {
  const prefix = normalizeTanzanianPhonePrefix(phoneNumber);

  if (!prefix) {
    return null;
  }

  return (
    operators.find((operator) => operator.prefixes.includes(prefix)) ?? null
  );
}
