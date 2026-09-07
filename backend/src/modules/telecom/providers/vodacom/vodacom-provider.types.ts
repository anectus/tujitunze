// Raw shapes as Vodacom's own systems would report them, BEFORE
// normalization into Tujitunze's WebhookResourceConversionDto /
// WebhookOutgoingTransactionDto. These are simulation/adapter-layer
// types only — no real Vodacom API contract exists yet (see CLAUDE.md),
// so field names here are a best-guess mapping, not a documented spec.
//
// Deliberately separate from backend/src/modules/telecom/vodacom/ (the
// M-Pesa C2B collection rail, migrations 0021-0023): that module moves
// real money in via Vodacom's actual Open API, while this one is a
// bundle-purchase / outgoing-transaction event *normalizer* for
// Principle 1 / Principle 2 simulation — unrelated concerns that happen
// to share a provider name.

export type VodacomBundleType = 'VOICE' | 'DATA' | 'SMS';
export type VodacomBundleUnit = 'MINUTES' | 'MB' | 'SMS';
export type VodacomServiceCode = 'C2C' | 'C2B' | 'CASHOUT' | 'BILLPAY';

export interface VodacomResourceConversionEvent {
  msisdn: string;
  bundleType: VodacomBundleType;
  bundleUnits: number;
  bundleUnitType: VodacomBundleUnit;
  unitValueTzs: number;
  purchaseTimestamp: string;
  vodacomTransactionId: string;
  vodacomReference?: string;
}

export interface VodacomOutgoingTransactionEvent {
  msisdn: string;
  serviceCode: VodacomServiceCode;
  amountTzs: number;
  settledAt: string;
  vodacomTransactionId: string;
  vodacomReference?: string;
}
