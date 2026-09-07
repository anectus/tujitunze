import { BadRequestException, Injectable } from '@nestjs/common';

import { WebhookResourceConversionDto } from '../../dto/webhook-resource-conversion.dto';
import { WebhookOutgoingTransactionDto } from '../../dto/webhook-outgoing-transaction.dto';
import type {
  VodacomOutgoingTransactionEvent,
  VodacomResourceConversionEvent,
  VodacomServiceCode,
} from './vodacom-provider.types';

const SERVICE_CODE_TO_TRANSACTION_TYPE: Record<
  VodacomServiceCode,
  WebhookOutgoingTransactionDto['transactionType']
> = {
  C2C: 'TUMA',
  C2B: 'LIPA_NAMBA',
  CASHOUT: 'TOA',
  BILLPAY: 'BILL_PAYMENT',
};

// Adapter that normalizes Vodacom-shaped events (as its own systems
// would report them — see vodacom-provider.types.ts) into the DTO
// shapes TelecomWebhooksController already accepts, so a simulated
// Vodacom event can be POSTed through the exact same
// resource-conversion / outgoing-transaction path a real operator
// integration would use. Pure normalization only: this service does
// not call the webhook endpoints itself and holds no DB/HTTP
// dependency, matching its role as a mapping layer, not a client.
@Injectable()
export class VodacomProviderService {
  normalizeResourceConversion(
    operatorId: number,
    event: VodacomResourceConversionEvent,
  ): WebhookResourceConversionDto {
    const dto = new WebhookResourceConversionDto();
    dto.operatorId = operatorId;
    dto.phoneNumber = this.normalizePhoneNumber(event.msisdn);
    dto.externalTransactionId = event.vodacomTransactionId;
    dto.resourceType = event.bundleType;
    dto.grossUnits = event.bundleUnits;
    dto.unit = event.bundleUnitType;
    dto.conversionTimestamp = event.purchaseTimestamp;
    dto.providerUnitValueTzs = event.unitValueTzs;
    if (event.vodacomReference) {
      dto.providerReference = event.vodacomReference;
    }
    return dto;
  }

  normalizeOutgoingTransaction(
    operatorId: number,
    event: VodacomOutgoingTransactionEvent,
  ): WebhookOutgoingTransactionDto {
    const transactionType = SERVICE_CODE_TO_TRANSACTION_TYPE[event.serviceCode];
    if (!transactionType) {
      throw new BadRequestException(
        `Unrecognized Vodacom service code: ${String(event.serviceCode)}`,
      );
    }

    const dto = new WebhookOutgoingTransactionDto();
    dto.operatorId = operatorId;
    dto.phoneNumber = this.normalizePhoneNumber(event.msisdn);
    dto.externalTransactionId = event.vodacomTransactionId;
    dto.transactionType = transactionType;
    dto.grossAmountTzs = event.amountTzs;
    dto.transactionTimestamp = event.settledAt;
    if (event.vodacomReference) {
      dto.providerReference = event.vodacomReference;
    }
    return dto;
  }

  // Vodacom's own systems report MSISDNs as 255XXXXXXXXX/+255XXXXXXXXX;
  // Tujitunze's phone_numbers table and BaseWebhookEventDto both expect
  // the local 0XXXXXXXXX form (see auth.service.ts's
  // normalizeTanzanianPhone, which this mirrors narrowly for the
  // Vodacom-only inbound shape rather than importing a private method
  // across modules).
  private normalizePhoneNumber(msisdn: string): string {
    const digitsOnly = msisdn.replace(/[^\d]/g, '');
    const local = digitsOnly.startsWith('255')
      ? `0${digitsOnly.slice(3)}`
      : digitsOnly;

    if (!/^0[67]\d{8}$/.test(local)) {
      throw new BadRequestException(
        `Unrecognized Vodacom MSISDN format: ${msisdn}`,
      );
    }
    return local;
  }
}
