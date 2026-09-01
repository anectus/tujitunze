import { Module } from '@nestjs/common';

import { VodacomMpesaHttpService } from './vodacom-mpesa-http.service';
import { VodacomMpesaService } from './vodacom-mpesa.service';
import { VodacomSessionService } from './vodacom-session.service';
import { VodacomTransactionRecorder } from './vodacom-transaction-recorder.service';
import { MPESA_API_CLIENT } from './vodacom-mpesa.types';

// Deliberately NOT imported into AppModule yet — this is foundation-
// only work (config, session caching, HTTP plumbing, DB persistence,
// provider-agnostic interface). No controller/route exists, no
// business logic (wallet crediting, insurance allocation) is wired to
// it, and the concrete Vodacom calls all throw
// VodacomEndpointNotDocumentedError. Importing this module changes
// nothing reachable from the outside; it exists so a later step can
// `imports: [VodacomMpesaModule]` once wiring is actually authorized.
@Module({
  providers: [
    VodacomMpesaHttpService,
    VodacomTransactionRecorder,
    VodacomMpesaService,
    { provide: MPESA_API_CLIENT, useExisting: VodacomMpesaService },
    VodacomSessionService,
  ],
  exports: [
    VodacomMpesaService,
    VodacomSessionService,
    VodacomMpesaHttpService,
  ],
})
export class VodacomMpesaModule {}
