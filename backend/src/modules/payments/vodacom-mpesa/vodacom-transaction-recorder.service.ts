import { Injectable } from '@nestjs/common';

import {
  RecordOutcomeInput,
  VodacomTransactionRecorder as SharedVodacomTransactionRecorder,
} from '../../telecom/vodacom/vodacom-transaction-recorder.service';

@Injectable()
export class VodacomTransactionRecorder extends SharedVodacomTransactionRecorder {
  async recordFailure(
    paymentTransactionId: number,
    failureReason: string,
    rawResponse: unknown,
  ) {
    return this.recordOutcome(paymentTransactionId, {
      status: 'FAILED',
      failureReason,
      rawResponse,
    });
  }

  async recordSuccess(
    paymentTransactionId: number,
    externalTransactionId: string,
    rawResponse: unknown,
  ) {
    return this.recordOutcome(paymentTransactionId, {
      status: 'SUCCESSFUL',
      externalTransactionId,
      rawResponse,
    });
  }
}

export type { RecordOutcomeInput };
