// MODEL B — telecom usage contribution domain model.
//
// Backs `telecom_usage_events` (migration
// 0019_telecom_usage_contribution.sql, corrected to Model B by
// 0020_telecom_usage_model_b.sql). Model B's core rule: TUJITUNZE does
// NOT compute 6% of a monetary value. It computes 6% of the USAGE
// QUANTITY itself (minutes/SMS/MB), producing a contribution quantity
// in the SAME unit, and only converts that contribution quantity to
// TZS using a value the TELECOM PROVIDER explicitly authorizes —
// TUJITUNZE never invents a per-MB/per-SMS/per-minute price.
//
//   quantity (usage)  --- x contributionRate --->  contributionQuantity (same unit)
//   contributionQuantity --- provider-authorized --->  providerValuationTzs (TZS, nullable)
//
// providerValuationTzs is nullable: a usage event may have a known
// contribution quantity before the provider has supplied (or if it
// cannot supply) an authorized TZS valuation. The database itself
// enforces that a row can never reach SUCCESSFUL status without one
// (see the CHECK constraint in 0020) — the wallet must never be
// credited on an invented value.
//
// Deliberately types-only: no service, no controller, no webhook
// wiring yet — that is explicitly deferred work. Not imported by any
// application code yet; introducing/changing it does not change
// runtime behavior. Mirrors the same convention
// payment-transaction.types.ts established: a snake_case row interface
// matching the DB columns exactly (for `manager.query<T[]>()` call
// sites, this codebase's established pattern for tables not backed by
// a TypeORM `@Entity`), a mapped camelCase shape for application code
// to return, and pure mapping/calculation functions between them.

export type UsageType = 'VOICE' | 'SMS' | 'DATA';

export type UsageUnit = 'MINUTES' | 'SMS' | 'MB';

// PENDING_REVIEW mirrors payment_transactions' identical addition: a
// usage event whose phone number cannot be confidently matched to a
// registered member must never auto-credit the wallet, and must
// instead surface here for reconciliation staff.
export type UsageEventStatus =
  'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REVERSED' | 'PENDING_REVIEW';

export interface TelecomUsageEventRow {
  usage_event_id: number;
  external_transaction_id: string;
  member_id: number | null;
  phone_number: string;
  phone_id: number | null;
  telecom_operator_id: number;
  usage_type: UsageType;
  quantity: string;
  unit: UsageUnit;
  contribution_rate: string;
  contribution_quantity: string;
  provider_valuation_tzs: string | null;
  currency: string;
  usage_timestamp: Date;
  status: UsageEventStatus;
  provider_reference: string | null;
  metadata: Record<string, unknown> | null;
  contribution_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TelecomUsageEvent {
  usageEventId: number;
  externalTransactionId: string;
  memberId: number | null;
  phoneNumber: string;
  phoneId: number | null;
  telecomOperatorId: number;
  usageType: UsageType;
  quantity: string;
  unit: UsageUnit;
  contributionRate: string;
  contributionQuantity: string;
  providerValuationTzs: string | null;
  currency: string;
  usageTimestamp: Date;
  status: UsageEventStatus;
  providerReference: string | null;
  metadata: Record<string, unknown> | null;
  contributionId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export function mapTelecomUsageEventRow(
  row: TelecomUsageEventRow,
): TelecomUsageEvent {
  return {
    usageEventId: row.usage_event_id,
    externalTransactionId: row.external_transaction_id,
    memberId: row.member_id,
    phoneNumber: row.phone_number,
    phoneId: row.phone_id,
    telecomOperatorId: row.telecom_operator_id,
    usageType: row.usage_type,
    quantity: row.quantity,
    unit: row.unit,
    contributionRate: row.contribution_rate,
    contributionQuantity: row.contribution_quantity,
    providerValuationTzs: row.provider_valuation_tzs,
    currency: row.currency,
    usageTimestamp: row.usage_timestamp,
    status: row.status,
    providerReference: row.provider_reference,
    metadata: row.metadata,
    contributionId: row.contribution_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// The one pure calculation this domain model owns on the USAGE side:
// consumed quantity * configured rate, rounded to 2 decimal places, in
// the SAME unit as the usage (minutes -> minutes, SMS -> SMS, MB -> MB).
// Takes the rate as a parameter rather than hardcoding 6% — the
// business requirement is explicit that the rate must come from
// contribution_rules (rule_type IN ('VOICE','SMS','DATA'), see
// migration 0019), never be a literal constant in application code.
//
// This function deliberately does NOT compute a TZS value — Model B's
// core rule is that TUJITUNZE never invents a monetary price for a
// contribution quantity. Converting contributionQuantity to TZS is the
// telecom provider's own authorized figure
// (TelecomUsageEvent.providerValuationTzs), supplied by them, not
// derived here.
export function calculateContributionQuantity(
  quantity: number,
  rate: number,
): number {
  return Math.round(quantity * rate * 100) / 100;
}

// telecom_contributions.reference_number is UNIQUE across the ENTIRE
// table, not scoped per contribution_source — the purchase-based flow
// (TelecomService.handleContributionWebhook) already writes the raw
// externalTransactionId verbatim into it. Namespacing a usage-event's
// reference with its usage type avoids a real (if unlikely) collision
// between a purchase event and a usage event that happen to share an
// external id from the operator's own two separate systems, while
// staying deterministic so a reconciliation upload can reproduce it.
export function buildUsageContributionReference(
  usageType: UsageType,
  externalTransactionId: string,
): string {
  return `USG-${usageType}-${externalTransactionId}`;
}
