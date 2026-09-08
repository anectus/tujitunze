import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { AdminModule } from './modules/admin/admin.module';
import { BankModule } from './modules/bank/bank.module';
import { TelecomModule } from './modules/telecom/telecom.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { ContactModule } from './modules/contact/contact.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    // Generous global default — routes that need a tighter limit set their
    // own @Throttle(...) (see members.controller.ts, auth.controller.ts,
    // bank/telecom/super-admin controllers).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    AuthModule,
    MembersModule,
    AdminModule,
    BankModule,
    TelecomModule,
    InsuranceModule,
    SuperAdminModule,
    NotificationsModule,
    AuditLogsModule,
    WalletsModule,
    ContactModule,
    SearchModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
