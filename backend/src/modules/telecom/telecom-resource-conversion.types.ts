// PRINCIPLE 1 — telecom resource-conversion domain model.
//
// Backs `telecom_resource_conversion_events` + `telecom_resource_usage_splits`
// (migration 0025_dual_mode_micro_savings.sql, split by 0028 — see this
// file's later note). Core rule: the saving is a share
// of the RESOURCE being granted (minutes/MB/SMS), held back at the
// moment of CONVERSION — not a share of a monetary value, and not
// computed from usage after the fact (that was the removed "Model B"
// shape; see CLAUDE.md's Telecom section for why it was replaced).
//
//   grossUnits (requested)  --- x savingRate --->  savedUnits (same unit)
//   netUnitsToCustomer = grossUnits - savedUnits   (what actually gets granted)
//   savedValueTzs = savedUnits x providerUnitValueTzs  (operator-authorized, never invented)
//
// Deliberately types-only, same convention `telecom-usage-event.types.ts`
// established before it: a snake_case row interface matching the DB
// columns exactly (for `manager.query<T[]>()` call sites), a mapped
// camelCase shape for application code, and pure mapping/calculation
// functions between them.
//
// As of migration 0028, the underlying data lives in two physically
// separate tables — telecom_resource_conversion_events (Transaction
// Ledger: the raw inbound event) and telecom_resource_usage_splits
// (Usage Ledger: the gross/customer/saved split, one row per event).
// TelecomResourceConversionRow below is still the flat *read* shape
// (produced by a JOIN across both — see
// TelecomService.selectResourceConversionRow) so this file's mapper
// and every consumer of it are unchanged by that split.

export type ResourceType = 'VOICE' | 'DATA' | 'SMS';

export type ResourceUnit = 'MINUTES' | 'MB' | 'SMS';

// NO_ACTIVE_RULE / OPTED_OUT (added migration 0026) are both terminal,
// zero-saving outcomes that are still persisted — unlike the prior
// behavior of throwing without writing a row — so every inbound event
// leaves an audit trail regardless of outcome.
export type ResourceConversionStatus =
  | 'PENDING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'REVERSED'
  | 'PENDING_REVIEW'
  | 'NO_ACTIVE_RULE'
  | 'OPTED_OUT';

export interface TelecomResourceConversionRow {
  conversion_id: number;
  external_transaction_id: string;
  member_id: number | null;
  phone_number: string;
  phone_id: number | null;
  telecom_operator_id: number;
  resource_type: ResourceType;
  gross_units: string;
  unit: ResourceUnit;
  saving_rate: string;
  saved_units: string;
  net_units_to_customer: string;
  provider_unit_value_tzs: string;
  saved_value_tzs: string;
  currency: string;
  status: ResourceConversionStatus;
  contribution_id: number | null;
  conversion_timestamp: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TelecomResourceConversion {
  conversionId: number;
  externalTransactionId: string;
  memberId: number | null;
  phoneNumber: string;
  phoneId: number | null;
  telecomOperatorId: number;
  resourceType: ResourceType;
  grossUnits: string;
  unit: ResourceUnit;
  savingRate: string;
  savedUnits: string;
  netUnitsToCustomer: string;
  providerUnitValueTzs: string;
  savedValueTzs: string;
  currency: string;
  status: ResourceConversionStatus;
  contributionId: number | null;
  conversionTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function mapTelecomResourceConversionRow(
  row: TelecomResourceConversionRow,
): TelecomResourceConversion {
  return {
    conversionId: row.conversion_id,
    externalTransactionId: row.external_transaction_id,
    memberId: row.member_id,
    phoneNumber: row.phone_number,
    phoneId: row.phone_id,
    telecomOperatorId: row.telecom_operator_id,
    resourceType: row.resource_type,
    grossUnits: row.gross_units,
    unit: row.unit,
    savingRate: row.saving_rate,
    savedUnits: row.saved_units,
    netUnitsToCustomer: row.net_units_to_customer,
    providerUnitValueTzs: row.provider_unit_value_tzs,
    savedValueTzs: row.saved_value_tzs,
    currency: row.currency,
    status: row.status,
    contributionId: row.contribution_id,
    conversionTimestamp: row.conversion_timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// The unit -> resource-type pairing a valid conversion request must
// respect — same shape as the removed feature's assertUsageUnitMatchesType,
// kept because it was a good invariant, not because the code was reused.
export const RESOURCE_TYPE_UNIT: Record<ResourceType, ResourceUnit> = {
  VOICE: 'MINUTES',
  DATA: 'MB',
  SMS: 'SMS',
};

// The one calculation this domain model owns: how many units are held
// back, and how many actually reach the customer. Rounded to 2 decimal
// places (fractional minutes are real — a 10.5-minute-equivalent
// bundle is a legitimate operator figure).
export function calculateResourceConversion(
  grossUnits: number,
  savingRate: number,
): { savedUnits: number; netUnitsToCustomer: number } {
  const savedUnits = Math.round(grossUnits * savingRate * 100) / 100;
  const netUnitsToCustomer = Math.round((grossUnits - savedUnits) * 100) / 100;
  return { savedUnits, netUnitsToCustomer };
}

export function buildResourceConversionReference(
  resourceType: ResourceType,
  externalTransactionId: string,
): string {
  return `RSC-${resourceType}-${externalTransactionId}`;
}
