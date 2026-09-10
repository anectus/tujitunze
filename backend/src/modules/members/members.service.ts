import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { DataSource, EntityManager, Not } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { PhoneNumber } from './entities/phone-number.entity';
import { MemberBankAccount } from './entities/bank-account.entity';
import { RegisterDto } from './dto/register.dto';
import { AddPhoneNumberDto } from './dto/add-phone-number.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddBankAccountDto } from './dto/add-bank-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSavingConsentDto } from './dto/update-saving-consent.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

// TB + zero-padded 6-digit user id — computed on read rather than stored,
// since the schema has no dedicated member-number column yet (see the
// product-spec gap notes). Matches the "TB######" format members are
// meant to be issued.
function formatMemberId(userId: number): string {
  return `TB${String(userId).padStart(6, '0')}`;
}

// Single source of truth for "has this member finished the Complete
// Your Membership step" (MobileMoneyAccountForm / POST-register
// onboarding), read by both the dashboard's redirect gate and the
// header's "Complete Membership" nudge so the two can never disagree.
// Deliberately mirrors what that form actually requires — gender,
// region, and at least one linked mobile money number — not what it
// merely offers: a bank account is explicitly optional there (its own
// label says so, and nothing in the form marks it `required`), so it is
// intentionally excluded here too rather than gating members who chose
// not to link one.
interface MembershipCompletionStatus {
  membershipComplete: boolean;
  // Same value as membershipComplete today — kept as its own named flag
  // (not just an alias read off membershipComplete at each call site) so
  // a future rule stricter than plain onboarding completion (e.g. a
  // suspended member) can diverge from it without another signature
  // change here.
  canManageAccounts: boolean;
}

function isMembershipComplete(
  user: Pick<User, 'gender' | 'region' | 'phoneNumbers'>,
): MembershipCompletionStatus {
  const membershipComplete =
    !!user.gender &&
    !!user.region &&
    user.phoneNumbers.some((phone) => phone.phoneStatus === 'Active');

  return { membershipComplete, canManageAccounts: membershipComplete };
}

interface MemberInsurancePolicy {
  member_insurance_id: number;
  policy_number: string;
  start_date: Date;
  end_date: Date | null;
  policy_status: string;
  plan_id: number;
  plan_name: string;
  premium_amount: string | null;
  coverage_amount: string | null;
  provider_id: number;
  provider_name: string;
}

interface MemberClaim {
  claim_id: number;
  claim_number: string;
  claim_amount: string;
  approved_amount: string | null;
  claim_status: string;
  claim_date: Date;
  processed_date: Date | null;
  remarks: string | null;
  hospital_id: number;
  hospital_name: string;
}

interface MemberVerification {
  verification_id: number;
  verification_method: string;
  verification_result: string;
  member_status: string | null;
  verified_date: Date;
  remarks: string | null;
  hospital_id: number;
  hospital_name: string;
}

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
  prefixes: string[];
}

interface Bank {
  bank_id: number;
  bank_name: string;
}

interface Region {
  region_id: number;
  region_name: string;
  area_type: string;
}

interface District {
  district_id: number;
  district_name: string;
  region_id: number;
}

@Injectable()
export class MembersService {
  // TCRA-aligned per-operator SIM caps under a single NIDA (see
  // assertSimSlotAvailable below): one standard mobile-money number per
  // operator, up to four M2M (IoT/router/tracking) SIMs per operator.
  private static readonly STANDARD_SIM_LIMIT_PER_OPERATOR = 1;
  private static readonly M2M_SIM_LIMIT_PER_OPERATOR = 4;

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // =====================================================
  // Normalize a Tanzanian phone number.
  //
  // Accepted: 0712345678 / 255712345678 / +255712345678
  // Stored:   0712345678
  // =====================================================

  private normalizeTanzanianPhone(raw: string): string {
    let phoneNumber = raw.trim().replace(/\s+/g, '');

    if (phoneNumber.startsWith('+255')) {
      phoneNumber = '0' + phoneNumber.substring(4);
    } else if (phoneNumber.startsWith('255')) {
      phoneNumber = '0' + phoneNumber.substring(3);
    }

    if (!/^0[67]\d{8}$/.test(phoneNumber)) {
      throw new BadRequestException('Invalid Tanzanian mobile phone number');
    }

    return phoneNumber;
  }

  private async findActiveOperatorForPrefix(
    manager: EntityManager,
    prefix: string,
  ): Promise<TelecomOperator> {
    const operatorResult = await manager.query<TelecomOperator[]>(
      `
          SELECT
            o.operator_id,
            o.operator_name
          FROM telecom_operators o
          INNER JOIN telecom_operator_prefixes p
            ON p.operator_id = o.operator_id
          WHERE p.prefix = $1
            AND p.status = 'Active'
            AND o.status = 'Active'
          LIMIT 1
          `,
      [prefix],
    );

    if (!operatorResult || operatorResult.length === 0) {
      throw new BadRequestException(
        `Telecom operator for prefix ${prefix} is not supported`,
      );
    }

    return operatorResult[0];
  }

  private async findActiveBank(
    manager: EntityManager,
    bankId: number,
  ): Promise<Bank> {
    const bankResult = await manager.query<Bank[]>(
      `
      SELECT bank_id, bank_name
      FROM banks
      WHERE bank_id = $1
        AND status = 'Active'
      LIMIT 1
      `,
      [bankId],
    );

    if (!bankResult || bankResult.length === 0) {
      throw new BadRequestException('Selected bank is not supported');
    }

    return bankResult[0];
  }

  private async findActiveRegion(
    manager: EntityManager,
    regionName: string,
  ): Promise<Region> {
    const regionResult = await manager.query<Region[]>(
      `
      SELECT region_id, region_name, area_type
      FROM regions
      WHERE region_name = $1
        AND status = 'Active'
      LIMIT 1
      `,
      [regionName],
    );

    if (!regionResult || regionResult.length === 0) {
      throw new BadRequestException('Selected region is not supported');
    }

    return regionResult[0];
  }

  private async findActiveDistrict(
    manager: EntityManager,
    regionId: number,
    districtName: string,
  ): Promise<District> {
    const districtResult = await manager.query<District[]>(
      `
      SELECT district_id, district_name, region_id
      FROM districts
      WHERE region_id = $1
        AND district_name = $2
        AND status = 'Active'
      LIMIT 1
      `,
      [regionId, districtName],
    );

    if (!districtResult || districtResult.length === 0) {
      throw new BadRequestException(
        'Selected district does not belong to the selected region',
      );
    }

    return districtResult[0];
  }

  private async findOperatorById(
    manager: EntityManager,
    operatorId: number,
  ): Promise<TelecomOperator> {
    const operatorResult = await manager.query<TelecomOperator[]>(
      `
      SELECT operator_id, operator_name
      FROM telecom_operators
      WHERE operator_id = $1
      LIMIT 1
      `,
      [operatorId],
    );

    if (!operatorResult || operatorResult.length === 0) {
      throw new BadRequestException('Selected network is not supported');
    }

    return operatorResult[0];
  }

  async register(data: RegisterDto) {
    // =====================================================
    // 1. Field presence/shape is enforced by RegisterDto via the
    //    global ValidationPipe — only business-rule validation
    //    (phone format, uniqueness) happens here.
    // =====================================================

    // =====================================================
    // 2. Clean input
    // =====================================================

    const firstName = data.firstName.trim();

    const secondName = data.secondName?.trim() || null;

    const surname = data.surname.trim();

    const email = data.email?.trim().toLowerCase() || null;

    const nidaNumber = data.nidaNumber.trim();

    const phoneNumber = this.normalizeTanzanianPhone(data.phoneNumber);

    // =====================================================
    // 4. Database transaction
    // =====================================================

    return this.dataSource.transaction(async (manager) => {
      // =================================================
      // 5. Check existing phone
      // =================================================

      const existingPhone = await manager.findOne(PhoneNumber, {
        where: { phoneNumber },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number is already registered');
      }

      // =================================================
      // 6. Check existing NIDA
      // =================================================

      const existingNida = await manager.findOne(User, {
        where: {
          nidaNumber,
        },
      });

      if (existingNida) {
        throw new ConflictException('NIDA number is already registered');
      }

      // =================================================
      // 7. Check existing email
      // =================================================

      if (email) {
        const existingEmail = await manager.findOne(User, {
          where: {
            email,
          },
        });

        if (existingEmail) {
          throw new ConflictException('Email is already registered');
        }
      }

      // =================================================
      // 8. Extract telecom prefix
      // =================================================

      const prefix = phoneNumber.substring(0, 3);

      // =================================================
      // 9. Find telecom operator
      // =================================================

      const operator = await this.findActiveOperatorForPrefix(manager, prefix);

      // =================================================
      // 10. Hash password
      // =================================================

      const passwordHash = await bcrypt.hash(data.password, 12);

      // =================================================
      // 11. Create user
      // =================================================

      const user = manager.create(User, {
        firstName,
        secondName,
        surname,
        email,
        nidaNumber,
        passwordHash,

        memberStatus: 'Pending',

        emailVerified: false,
        phoneVerified: false,
      });

      // =================================================
      // 12. Save user
      // =================================================

      const savedUser = await manager.save(User, user);

      // =================================================
      // 13. Create phone number
      // =================================================

      const phone = manager.create(PhoneNumber, {
        userId: savedUser.userId,

        operatorId: operator.operator_id,

        phoneNumber,

        isPrimary: true,

        phoneStatus: 'Active',
      });

      // =================================================
      // 14. Save phone number
      // =================================================

      const savedPhone = await manager.save(PhoneNumber, phone);

      // =================================================
      // 14b. Assign the default 'Member' role
      // =================================================

      const roleResult = await manager.query<{ role_id: number }[]>(
        `SELECT role_id FROM roles WHERE role_name = $1 LIMIT 1`,
        ['Member'],
      );

      if (!roleResult || roleResult.length === 0) {
        throw new InternalServerErrorException('Member role is not configured');
      }

      await manager.query(
        `INSERT INTO member_roles (member_id, role_id) VALUES ($1, $2)`,
        [savedUser.userId, roleResult[0].role_id],
      );

      // =================================================
      // 15. Remove password hash
      // =================================================

      const { passwordHash: _passwordHash, ...safeUser } = savedUser;

      // =================================================
      // 16. Return response
      // =================================================

      return {
        message:
          'Registration successful. Your account is pending verification.',

        member: safeUser,

        phone: {
          phoneId: savedPhone.phoneId,

          phoneNumber: savedPhone.phoneNumber,

          operatorId: savedPhone.operatorId,

          operatorName: operator.operator_name,

          isPrimary: savedPhone.isPrimary,

          phoneStatus: savedPhone.phoneStatus,
        },
      };
    });
  }

  async getProfile(userId: number) {
    const user = await this.dataSource.manager.findOne(User, {
      where: { userId },
      relations: { phoneNumbers: true },
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    const bankAccounts = await this.dataSource.manager.find(MemberBankAccount, {
      where: { memberId: userId },
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;
    const { membershipComplete, canManageAccounts } =
      isMembershipComplete(user);

    return {
      ...safeUser,
      bankAccounts,
      membershipComplete,
      canManageAccounts,
    };
  }

  async updateProfile(userId: number, data: UpdateProfileDto) {
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

    const region = await this.findActiveRegion(
      this.dataSource.manager,
      data.region.trim(),
    );

    const districtName = data.district?.trim() || null;

    const district = districtName
      ? await this.findActiveDistrict(
          this.dataSource.manager,
          region.region_id,
          districtName,
        )
      : null;

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { userId } });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      const wasOnboarded = !!user.region;

      user.gender = data.gender;
      user.dateOfBirth = dateOfBirth;
      user.region = region.region_name;
      user.district = district?.district_name ?? null;

      const savedUser = await manager.save(User, user);

      if (!wasOnboarded) {
        await this.notificationsService.create(manager, {
          memberId: userId,
          notificationType: 'Membership',
          title: 'Membership profile completed',
          message:
            'Your onboarding is complete. Your membership details are now up to date.',
        });
      }

      const { passwordHash: _passwordHash, ...safeUser } = savedUser;

      return safeUser;
    });
  }

  async listTelecomOperators() {
    return this.dataSource.manager.query<TelecomOperator[]>(
      `
      SELECT
        o.operator_id,
        o.operator_name,
        COALESCE(
          array_agg(p.prefix ORDER BY p.prefix) FILTER (WHERE p.prefix IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) AS prefixes
      FROM telecom_operators o
      LEFT JOIN telecom_operator_prefixes p
        ON p.operator_id = o.operator_id
        AND p.status = 'Active'
      WHERE o.status = 'Active'
      GROUP BY o.operator_id, o.operator_name
      ORDER BY o.operator_name
      `,
    );
  }

  async listBanks() {
    return this.dataSource.manager.query<Bank[]>(
      `
      SELECT bank_id, bank_name
      FROM banks
      WHERE status = 'Active'
      ORDER BY bank_name
      `,
    );
  }

  async listRegions() {
    return this.dataSource.manager.query<Region[]>(
      `
      SELECT region_id, region_name, area_type
      FROM regions
      WHERE status = 'Active'
      ORDER BY region_name
      `,
    );
  }

  async listDistrictsByRegion(regionId: number) {
    return this.dataSource.manager.query<District[]>(
      `
      SELECT district_id, district_name, region_id
      FROM districts
      WHERE region_id = $1
        AND status = 'Active'
      ORDER BY district_name
      `,
      [regionId],
    );
  }

  // Mirrors getSavingConsent's own "absence of a row means consented"
  // rule (see that method's doc comment) — kept as a separate helper
  // rather than having addPhoneNumber/addBankAccount call
  // getSavingConsent itself, since that method reads via
  // this.dataSource.query outside any transaction, while these two need
  // the read inside their own transaction's manager.
  private async isSavingConsented(
    manager: EntityManager,
    userId: number,
  ): Promise<boolean> {
    const [row] = await manager.query<{ consented: boolean }[]>(
      `SELECT consented FROM member_saving_consents WHERE member_id = $1`,
      [userId],
    );

    return row ? row.consented : true;
  }

  // TCRA rule: a member may hold one Standard SIM per operator under
  // their NIDA, or up to four M2M SIMs per operator (device SIMs are
  // explicitly excluded from the one-per-operator rule). Counts only
  // non-Inactive rows — a removed (unlinked) number frees its slot, same
  // as everywhere else that treats 'Inactive' as "doesn't count".
  // excludePhoneId lets a reactivation check the limit as if its own row
  // weren't already there.
  private async assertSimSlotAvailable(
    manager: EntityManager,
    userId: number,
    operatorId: number,
    simType: string,
    operatorName: string,
    excludePhoneId?: number,
  ): Promise<void> {
    const limit =
      simType === 'M2M'
        ? MembersService.M2M_SIM_LIMIT_PER_OPERATOR
        : MembersService.STANDARD_SIM_LIMIT_PER_OPERATOR;

    const qb = manager
      .createQueryBuilder(PhoneNumber, 'phone')
      .where('phone.userId = :userId', { userId })
      .andWhere('phone.operatorId = :operatorId', { operatorId })
      .andWhere('phone.simType = :simType', { simType })
      .andWhere("phone.phoneStatus != 'Inactive'");

    if (excludePhoneId) {
      qb.andWhere('phone.phoneId != :excludePhoneId', { excludePhoneId });
    }

    const activeCount = await qb.getCount();

    if (activeCount >= limit) {
      throw new ConflictException(
        simType === 'M2M'
          ? `You already have the maximum of ${limit} M2M SIMs registered with ${operatorName} under your NIDA.`
          : `You already have a ${operatorName} SIM registered under your NIDA. Only one standard SIM per operator is allowed — register it as an M2M SIM instead if this is for an IoT device, router, or tracker.`,
      );
    }
  }

  // "You already have this account type at this bank" rule: bankId +
  // accountType + currency + accountCapacity must be unique per member
  // among non-Inactive rows (an unlinked account frees its combination,
  // same reasoning as assertSimSlotAvailable above). excludeAccountId
  // lets a reactivation check as if its own row weren't already there.
  private async assertBankProductAvailable(
    manager: EntityManager,
    userId: number,
    bankId: number,
    accountType: string | null,
    currency: string,
    accountCapacity: string,
    excludeAccountId?: number,
  ): Promise<void> {
    const qb = manager
      .createQueryBuilder(MemberBankAccount, 'account')
      .where('account.memberId = :userId', { userId })
      .andWhere('account.bankId = :bankId', { bankId })
      .andWhere('account.currency = :currency', { currency })
      .andWhere('account.accountCapacity = :accountCapacity', {
        accountCapacity,
      })
      .andWhere("account.accountStatus != 'Inactive'");

    if (accountType === null) {
      qb.andWhere('account.accountType IS NULL');
    } else {
      qb.andWhere('account.accountType = :accountType', { accountType });
    }

    if (excludeAccountId) {
      qb.andWhere('account.memberBankAccountId != :excludeAccountId', {
        excludeAccountId,
      });
    }

    const existing = await qb.getExists();

    if (existing) {
      throw new ConflictException(
        'You already have this account type at this bank.',
      );
    }
  }

  async addPhoneNumber(
    userId: number,
    data: AddPhoneNumberDto,
    ipAddress: string | null = null,
  ) {
    const phoneNumber = this.normalizeTanzanianPhone(data.phoneNumber);

    const accountNumber = data.accountNumber?.trim() || null;

    const simType = data.simType === 'M2M' ? 'M2M' : 'Standard';

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { userId },
        relations: { phoneNumbers: true },
      });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      // Onboarding itself calls this endpoint (see MobileMoneyAccountForm's
      // step 2) — safe to gate here because step 1 (PATCH /members/me)
      // always runs first and, combined with the Active phone number every
      // member already has from registration, makes canManageAccounts true
      // before this ever executes for a first-time member.
      if (!isMembershipComplete(user).canManageAccounts) {
        throw new ForbiddenException(
          'Complete your membership profile before linking another account',
        );
      }

      // A member who has switched off automatic micro-savings must turn
      // it back on before linking a new contribution source — every new
      // phone/bank account exists to feed that engine, so adding one
      // while opted out would silently do nothing useful. Same
      // "absence means consented" default as everywhere else, so this
      // never blocks a first-time member who has no consent row yet.
      if (!(await this.isSavingConsented(manager, userId))) {
        throw new ForbiddenException(
          'Turn on Automatic Micro-Savings before linking another account',
        );
      }

      const existingPhone = await manager.findOne(PhoneNumber, {
        where: {
          phoneNumber,
        },
      });

      if (existingPhone) {
        if (existingPhone.userId !== userId) {
          throw new ConflictException('Phone number is already registered');
        }

        // Previously this returned the existing row completely as-is,
        // including a stale 'Inactive' phoneStatus if the member had
        // unlinked this exact number before — the response looked like a
        // successful (re-)link, but the number silently stayed excluded
        // from contribution matching. Reactivate it here instead, same
        // as the dedicated reactivatePhoneNumber endpoint below.
        if (existingPhone.phoneStatus === 'Inactive') {
          const reactivatedOperator = await this.findOperatorById(
            manager,
            existingPhone.operatorId,
          );

          // A slot may have filled up (a new SIM added on this operator)
          // in the time since this number was unlinked — reactivating it
          // now would push the member over their per-operator cap.
          await this.assertSimSlotAvailable(
            manager,
            userId,
            existingPhone.operatorId,
            existingPhone.simType,
            reactivatedOperator.operator_name,
            existingPhone.phoneId,
          );

          existingPhone.phoneStatus = 'Active';

          const reactivated = await manager.save(PhoneNumber, existingPhone);

          await this.auditLogsService.record(manager, {
            memberId: userId,
            actionType: 'phone_number.reactivate',
            affectedTable: 'phone_numbers',
            affectedRecordId: reactivated.phoneId,
            newValue: { phoneStatus: reactivated.phoneStatus },
            ipAddress,
          });

          await this.notificationsService.create(manager, {
            memberId: userId,
            notificationType: 'Security',
            title: 'Phone number reactivated',
            message: `${reactivated.phoneNumber} was reactivated and will resume contributing to your wallet.`,
          });

          return {
            phoneId: reactivated.phoneId,
            phoneNumber: reactivated.phoneNumber,
            accountNumber: reactivated.accountNumber,
            operatorId: reactivated.operatorId,
            operatorName: reactivatedOperator.operator_name,
            isPrimary: reactivated.isPrimary,
            phoneStatus: reactivated.phoneStatus,
            simType: reactivated.simType,
          };
        }

        // Already active — the member is re-submitting a number already
        // on file for their own account, most commonly their
        // registration phone number, entered again as a mobile money
        // account on the membership form. Treat it as already linked
        // instead of erroring.
        const existingOperator = await this.findOperatorById(
          manager,
          existingPhone.operatorId,
        );

        return {
          phoneId: existingPhone.phoneId,
          phoneNumber: existingPhone.phoneNumber,
          accountNumber: existingPhone.accountNumber,
          operatorId: existingPhone.operatorId,
          operatorName: existingOperator.operator_name,
          isPrimary: existingPhone.isPrimary,
          phoneStatus: existingPhone.phoneStatus,
          simType: existingPhone.simType,
        };
      }

      const prefix = phoneNumber.substring(0, 3);

      const operator = await this.findActiveOperatorForPrefix(manager, prefix);

      await this.assertSimSlotAvailable(
        manager,
        userId,
        operator.operator_id,
        simType,
        operator.operator_name,
      );

      const phone = manager.create(PhoneNumber, {
        userId,

        operatorId: operator.operator_id,

        phoneNumber,

        accountNumber,

        isPrimary: false,

        phoneStatus: 'Active',

        simType,
      });

      const savedPhone = await manager.save(PhoneNumber, phone);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'phone_number.add',
        affectedTable: 'phone_numbers',
        affectedRecordId: savedPhone.phoneId,
        newValue: {
          phoneNumber: savedPhone.phoneNumber,
          operatorId: savedPhone.operatorId,
        },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Phone number linked',
        message: `${savedPhone.phoneNumber} (${operator.operator_name}) was linked to your account.`,
      });

      return {
        phoneId: savedPhone.phoneId,

        phoneNumber: savedPhone.phoneNumber,

        accountNumber: savedPhone.accountNumber,

        operatorId: savedPhone.operatorId,

        operatorName: operator.operator_name,

        isPrimary: savedPhone.isPrimary,

        phoneStatus: savedPhone.phoneStatus,

        simType: savedPhone.simType,
      };
    });
  }

  async addBankAccount(
    userId: number,
    data: AddBankAccountDto,
    ipAddress: string | null = null,
  ) {
    const accountNumber = data.accountNumber.trim();

    const currency = data.currency?.trim().toUpperCase() || 'TZS';
    const accountCapacity = data.accountCapacity || 'Individual';

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { userId },
        relations: { phoneNumbers: true },
      });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      if (!isMembershipComplete(user).canManageAccounts) {
        throw new ForbiddenException(
          'Complete your membership profile before linking another account',
        );
      }

      if (!(await this.isSavingConsented(manager, userId))) {
        throw new ForbiddenException(
          'Turn on Automatic Micro-Savings before linking another account',
        );
      }

      const existingAccount = await manager.findOne(MemberBankAccount, {
        where: { accountNumber },
      });

      if (existingAccount) {
        if (
          existingAccount.memberId !== userId ||
          existingAccount.accountStatus !== 'Inactive'
        ) {
          // Either someone else's account number, or this member's own
          // account that's still linked — a true duplicate either way.
          throw new ConflictException(
            'Bank account number is already registered',
          );
        }

        // A slot may have filled up (a new account added for this exact
        // bank/type/currency/capacity combination) in the time since
        // this account was unlinked — reactivating it now would create a
        // duplicate product.
        await this.assertBankProductAvailable(
          manager,
          userId,
          existingAccount.bankId,
          existingAccount.accountType,
          existingAccount.currency,
          existingAccount.accountCapacity,
          existingAccount.memberBankAccountId,
        );

        // Previously this branch threw the ConflictException above
        // unconditionally, even for the member's own account they'd
        // simply unlinked before — meaning there was no way back in
        // once removed. Reactivate it instead, same as
        // reactivateBankAccount below. 'Pending', not 'Active': no
        // verification flow exists yet to ever promote a bank account
        // out of this default (see BankService's own matching-query
        // comment), so this is the same non-Inactive state the account
        // started in.
        existingAccount.accountStatus = 'Pending';

        const reactivated = await manager.save(
          MemberBankAccount,
          existingAccount,
        );

        await this.auditLogsService.record(manager, {
          memberId: userId,
          actionType: 'bank_account.reactivate',
          affectedTable: 'member_bank_accounts',
          affectedRecordId: reactivated.memberBankAccountId,
          newValue: { accountStatus: reactivated.accountStatus },
          ipAddress,
        });

        await this.notificationsService.create(manager, {
          memberId: userId,
          notificationType: 'Security',
          title: 'Bank account reactivated',
          message: `Your bank account ending ${reactivated.accountNumber.slice(-4)} was reactivated and will resume contributing to your wallet.`,
        });

        const [reactivatedBank] = await manager.query<
          { bank_name: string }[]
        >(`SELECT bank_name FROM banks WHERE bank_id = $1`, [
          reactivated.bankId,
        ]);

        return {
          memberBankAccountId: reactivated.memberBankAccountId,
          bankId: reactivated.bankId,
          bankName: reactivatedBank?.bank_name ?? null,
          accountNumber: reactivated.accountNumber,
          accountHolderName: reactivated.accountHolderName,
          accountType: reactivated.accountType,
          isPrimary: reactivated.isPrimary,
          accountStatus: reactivated.accountStatus,
          verificationStatus: reactivated.verificationStatus,
          currency: reactivated.currency,
          accountCapacity: reactivated.accountCapacity,
        };
      }

      const bank = await this.findActiveBank(manager, data.bankId);

      await this.assertBankProductAvailable(
        manager,
        userId,
        bank.bank_id,
        data.accountType,
        currency,
        accountCapacity,
      );

      const existingAccountsCount = await manager.count(MemberBankAccount, {
        where: { memberId: userId },
      });

      const accountHolderName =
        data.accountHolderName?.trim() ||
        [user.firstName, user.secondName, user.surname]
          .filter(Boolean)
          .join(' ');

      const bankAccount = manager.create(MemberBankAccount, {
        memberId: userId,

        bankId: bank.bank_id,

        accountNumber,

        accountHolderName,

        accountType: data.accountType,

        accountStatus: 'Pending',

        verificationStatus: 'Pending',

        isPrimary: existingAccountsCount === 0,

        currency,

        accountCapacity,
      });

      const saved = await manager.save(MemberBankAccount, bankAccount);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank_account.add',
        affectedTable: 'member_bank_accounts',
        affectedRecordId: saved.memberBankAccountId,
        newValue: {
          bankId: saved.bankId,
          accountNumber: saved.accountNumber,
          accountType: saved.accountType,
        },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Bank account linked',
        message: `A ${bank.bank_name} account ending ${accountNumber.slice(-4)} was linked to your account.`,
      });

      return {
        memberBankAccountId: saved.memberBankAccountId,
        bankId: saved.bankId,
        bankName: bank.bank_name,
        accountNumber: saved.accountNumber,
        accountHolderName: saved.accountHolderName,
        accountType: saved.accountType,
        isPrimary: saved.isPrimary,
        accountStatus: saved.accountStatus,
        verificationStatus: saved.verificationStatus,
        currency: saved.currency,
        accountCapacity: saved.accountCapacity,
      };
    });
  }

  // =====================================================
  // Remove (unlink) a phone number / bank account — a soft delete
  // (status flips to 'Inactive') rather than a row DELETE, since
  // wallet_transactions/saving_ledger/insurance_allocations rows already
  // reference this history and must keep resolving. The two contribution
  // write paths that match a member by phone/account number
  // (TelecomService.handleContributionWebhook,
  // BankService.recordContribution) now both exclude 'Inactive' rows, so
  // this is a genuine "stop crediting from this source" action, not just
  // a status label nobody reads.
  // =====================================================

  async removePhoneNumber(
    userId: number,
    phoneId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const phone = await manager.findOne(PhoneNumber, {
        where: { phoneId, userId },
      });

      if (!phone) {
        throw new NotFoundException('Phone number not found');
      }

      if (phone.phoneStatus === 'Inactive') {
        throw new BadRequestException('This phone number is already unlinked');
      }

      phone.phoneStatus = 'Inactive';
      // A removed number can't stay flagged as the account's primary
      // contribution source.
      phone.isPrimary = false;

      const saved = await manager.save(PhoneNumber, phone);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'phone_number.remove',
        affectedTable: 'phone_numbers',
        affectedRecordId: saved.phoneId,
        newValue: { phoneStatus: saved.phoneStatus },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Phone number unlinked',
        message: `${saved.phoneNumber} was unlinked from your account. Contributions from this number will no longer be credited to your wallet.`,
      });

      return {
        phoneId: saved.phoneId,
        phoneNumber: saved.phoneNumber,
        phoneStatus: saved.phoneStatus,
      };
    });
  }

  async removeBankAccount(
    userId: number,
    memberBankAccountId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(MemberBankAccount, {
        where: { memberBankAccountId, memberId: userId },
      });

      if (!account) {
        throw new NotFoundException('Bank account not found');
      }

      if (account.accountStatus === 'Inactive') {
        throw new BadRequestException('This bank account is already unlinked');
      }

      account.accountStatus = 'Inactive';
      account.isPrimary = false;

      const saved = await manager.save(MemberBankAccount, account);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank_account.remove',
        affectedTable: 'member_bank_accounts',
        affectedRecordId: saved.memberBankAccountId,
        newValue: { accountStatus: saved.accountStatus },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Bank account unlinked',
        message: `Your bank account ending ${saved.accountNumber.slice(-4)} was unlinked from your account. Contributions from this account will no longer be credited to your wallet.`,
      });

      return {
        memberBankAccountId: saved.memberBankAccountId,
        accountNumber: saved.accountNumber,
        accountStatus: saved.accountStatus,
      };
    });
  }

  private isForeignKeyViolation(error: unknown): boolean {
    const code =
      (error as { code?: string; driverError?: { code?: string } })?.code ??
      (error as { driverError?: { code?: string } })?.driverError?.code;
    return code === '23503';
  }

  // =====================================================
  // Reactivate — the other half of removePhoneNumber/removeBankAccount
  // above. Gated the same way addPhoneNumber/addBankAccount are
  // (membership complete + saving consent on): bringing a removed
  // number/account back is functionally "linking a contribution source
  // again", so it earns the same rules a brand-new link does.
  // =====================================================

  async reactivatePhoneNumber(
    userId: number,
    phoneId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { userId },
        relations: { phoneNumbers: true },
      });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      if (!isMembershipComplete(user).canManageAccounts) {
        throw new ForbiddenException(
          'Complete your membership profile before linking another account',
        );
      }

      if (!(await this.isSavingConsented(manager, userId))) {
        throw new ForbiddenException(
          'Turn on Automatic Micro-Savings before linking another account',
        );
      }

      const phone = await manager.findOne(PhoneNumber, {
        where: { phoneId, userId },
      });

      if (!phone) {
        throw new NotFoundException('Phone number not found');
      }

      if (phone.phoneStatus !== 'Inactive') {
        throw new BadRequestException('This phone number is already active');
      }

      const operator = await this.findOperatorById(manager, phone.operatorId);

      await this.assertSimSlotAvailable(
        manager,
        userId,
        phone.operatorId,
        phone.simType,
        operator.operator_name,
        phone.phoneId,
      );

      phone.phoneStatus = 'Active';

      const saved = await manager.save(PhoneNumber, phone);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'phone_number.reactivate',
        affectedTable: 'phone_numbers',
        affectedRecordId: saved.phoneId,
        newValue: { phoneStatus: saved.phoneStatus },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Phone number reactivated',
        message: `${saved.phoneNumber} was reactivated and will resume contributing to your wallet.`,
      });

      return {
        phoneId: saved.phoneId,
        phoneNumber: saved.phoneNumber,
        phoneStatus: saved.phoneStatus,
      };
    });
  }

  async reactivateBankAccount(
    userId: number,
    memberBankAccountId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { userId },
        relations: { phoneNumbers: true },
      });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      if (!isMembershipComplete(user).canManageAccounts) {
        throw new ForbiddenException(
          'Complete your membership profile before linking another account',
        );
      }

      if (!(await this.isSavingConsented(manager, userId))) {
        throw new ForbiddenException(
          'Turn on Automatic Micro-Savings before linking another account',
        );
      }

      const account = await manager.findOne(MemberBankAccount, {
        where: { memberBankAccountId, memberId: userId },
      });

      if (!account) {
        throw new NotFoundException('Bank account not found');
      }

      if (account.accountStatus !== 'Inactive') {
        throw new BadRequestException('This bank account is already active');
      }

      await this.assertBankProductAvailable(
        manager,
        userId,
        account.bankId,
        account.accountType,
        account.currency,
        account.accountCapacity,
        account.memberBankAccountId,
      );

      // 'Pending', not 'Active' — see addBankAccount's own reactivation
      // branch above for why.
      account.accountStatus = 'Pending';

      const saved = await manager.save(MemberBankAccount, account);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank_account.reactivate',
        affectedTable: 'member_bank_accounts',
        affectedRecordId: saved.memberBankAccountId,
        newValue: { accountStatus: saved.accountStatus },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Bank account reactivated',
        message: `Your bank account ending ${saved.accountNumber.slice(-4)} was reactivated and will resume contributing to your wallet.`,
      });

      return {
        memberBankAccountId: saved.memberBankAccountId,
        accountNumber: saved.accountNumber,
        accountStatus: saved.accountStatus,
      };
    });
  }

  // =====================================================
  // Permanently delete — a real row DELETE, unlike removePhoneNumber/
  // removeBankAccount's soft delete. Only ever allowed once an account
  // is already Inactive (unlinked first, so this is never someone's
  // only path to stop a live contribution source) AND has no financial
  // history referencing it.
  //
  // member_bank_accounts -> bank_transactions is declared ON DELETE
  // CASCADE in the schema (database/schema/tujitunze.sql), so Postgres
  // itself would silently wipe real transaction rows rather than reject
  // the delete — deleteBankAccountPermanently checks bank_transactions
  // explicitly for that reason. phone_numbers's referencing tables
  // (telecom_contributions and every dual-mode-savings event table) have
  // no cascade, so Postgres rejects the delete on its own with a foreign
  // key violation (23503) whenever history exists against any of them;
  // isForeignKeyViolation translates that into the same 409 here rather
  // than leaking a raw DB error, and doubles as a safety net for
  // deleteBankAccountPermanently against any *other* (non-cascading)
  // table this pass didn't enumerate by hand.
  // =====================================================

  async deletePhoneNumberPermanently(
    userId: number,
    phoneId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const phone = await manager.findOne(PhoneNumber, {
        where: { phoneId, userId },
      });

      if (!phone) {
        throw new NotFoundException('Phone number not found');
      }

      if (phone.phoneStatus !== 'Inactive') {
        throw new BadRequestException(
          'Unlink this phone number before deleting it permanently',
        );
      }

      try {
        await manager.delete(PhoneNumber, { phoneId });
      } catch (error) {
        if (this.isForeignKeyViolation(error)) {
          throw new ConflictException(
            'This phone number has contribution history and cannot be permanently deleted',
          );
        }
        throw error;
      }

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'phone_number.delete_permanent',
        affectedTable: 'phone_numbers',
        affectedRecordId: phoneId,
        oldValue: { phoneNumber: phone.phoneNumber },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Phone number deleted',
        message: `${phone.phoneNumber} was permanently deleted from your account.`,
      });

      return { phoneId, deleted: true };
    });
  }

  async deleteBankAccountPermanently(
    userId: number,
    memberBankAccountId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(MemberBankAccount, {
        where: { memberBankAccountId, memberId: userId },
      });

      if (!account) {
        throw new NotFoundException('Bank account not found');
      }

      if (account.accountStatus !== 'Inactive') {
        throw new BadRequestException(
          'Unlink this bank account before deleting it permanently',
        );
      }

      const [existingTransaction] = await manager.query<
        { bank_transaction_id: number }[]
      >(
        `SELECT bank_transaction_id FROM bank_transactions WHERE member_bank_account_id = $1 LIMIT 1`,
        [memberBankAccountId],
      );

      if (existingTransaction) {
        throw new ConflictException(
          'This bank account has transaction history and cannot be permanently deleted',
        );
      }

      try {
        await manager.delete(MemberBankAccount, { memberBankAccountId });
      } catch (error) {
        if (this.isForeignKeyViolation(error)) {
          throw new ConflictException(
            'This bank account has transaction history and cannot be permanently deleted',
          );
        }
        throw error;
      }

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank_account.delete_permanent',
        affectedTable: 'member_bank_accounts',
        affectedRecordId: memberBankAccountId,
        oldValue: { accountNumber: account.accountNumber },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Bank account deleted',
        message: `Your bank account ending ${account.accountNumber.slice(-4)} was permanently deleted from your account.`,
      });

      return { memberBankAccountId, deleted: true };
    });
  }

  async changePassword(
    userId: number,
    data: ChangePasswordDto,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { userId },
      });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      const currentPasswordMatches = await bcrypt.compare(
        data.currentPassword,
        user.passwordHash,
      );

      if (!currentPasswordMatches) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      user.passwordHash = await bcrypt.hash(data.newPassword, 12);

      await manager.save(User, user);

      // Never log password values (hash or plaintext) — the action itself
      // is what matters for the audit trail.
      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'member.password_change',
        affectedTable: 'users',
        affectedRecordId: userId,
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Password changed',
        message: 'Your account password was changed successfully.',
      });

      return { message: 'Password changed successfully.' };
    });
  }

  // =====================================================
  // My Membership — combines user status, wallet, and insurance into the
  // one summary the dashboard's "My Membership" / "Health Fund Status"
  // cards render. Raw SQL (rather than injecting HealthWallet/insurance
  // entities into this module) mirrors the existing cross-table read
  // pattern already used above for telecom operators/banks/regions.
  // =====================================================

  async getMembership(userId: number) {
    const user = await this.dataSource.manager.findOne(User, {
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    const [walletRow] = await this.dataSource.query<
      { balance: string; wallet_status: string }[]
    >(
      `SELECT balance, wallet_status FROM health_wallets WHERE member_id = $1 LIMIT 1`,
      [userId],
    );

    const [contributionSummary] = await this.dataSource.query<
      {
        has_contributed: boolean;
        last_contribution_date: Date | null;
        total: string;
      }[]
    >(
      `SELECT
         COUNT(wt.*) > 0 AS has_contributed,
         MAX(wt.transaction_date) AS last_contribution_date,
         COALESCE(SUM(wt.amount), 0) AS total
       FROM wallet_transactions wt
       INNER JOIN health_wallets hw ON hw.wallet_id = wt.wallet_id
       WHERE hw.member_id = $1`,
      [userId],
    );

    const [activePolicy] = await this.dataSource.query<
      {
        policy_number: string;
        policy_status: string;
        plan_name: string;
        provider_name: string;
        coverage_amount: string | null;
      }[]
    >(
      `SELECT
         mi.policy_number,
         mi.policy_status,
         ip.plan_name,
         ipr.provider_name,
         ip.coverage_amount
       FROM member_insurance mi
       INNER JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       INNER JOIN insurance_providers ipr ON ipr.provider_id = ip.provider_id
       WHERE mi.member_id = $1
         AND mi.policy_status = 'Active'
       ORDER BY mi.start_date DESC
       LIMIT 1`,
      [userId],
    );

    // A member is treated as healthcare-eligible once an Admin has
    // verified them (memberStatus = 'Active') — onboarding completion
    // (region set) is a separate, frontend-tracked concept (see
    // LoginForm/Header's "Complete Membership" flow) that doesn't by
    // itself grant eligibility.
    const healthcareEligible = user.memberStatus === 'Active';

    return {
      memberId: formatMemberId(user.userId),
      memberStatus: user.memberStatus,
      registrationDate: user.createdAt,
      onboardingComplete: !!user.region,
      healthcareEligible,
      fundStatus: {
        balance: walletRow ? Number(walletRow.balance) : 0,
        walletStatus: walletRow ? walletRow.wallet_status : 'Not yet opened',
      },
      contributionStatus: {
        hasContributed: contributionSummary?.has_contributed ?? false,
        lastContributionDate:
          contributionSummary?.last_contribution_date ?? null,
        totalContributed: contributionSummary
          ? Number(contributionSummary.total)
          : 0,
      },
      coverage: activePolicy
        ? {
            policyNumber: activePolicy.policy_number,
            status: activePolicy.policy_status,
            planName: activePolicy.plan_name,
            providerName: activePolicy.provider_name,
            coverageAmount: activePolicy.coverage_amount
              ? Number(activePolicy.coverage_amount)
              : null,
          }
        : null,
    };
  }

  // =====================================================
  // Micro-savings summary — the member-facing view of both principles
  // of the dual-mode savings engine (see CLAUDE.md 2026-09-02 entry /
  // design doc). Reads saving_ledger, the single cross-principle audit
  // trail both `TelecomService.handleResourceConversionWebhook` and
  // `handleOutgoingTransactionWebhook` append to in the same
  // transaction as the wallet credit, so this never has to reconcile
  // two separate source tables itself.
  // =====================================================

  async getSavingsSummary(userId: number) {
    const byPrinciple = await this.dataSource.query<
      { principle: string; count: number; total: string }[]
    >(
      `SELECT principle, COUNT(*)::int AS count, COALESCE(SUM(saved_value_tzs), 0) AS total
       FROM saving_ledger
       WHERE member_id = $1
       GROUP BY principle`,
      [userId],
    );

    const recent = await this.dataSource.query<
      {
        ledger_id: number;
        principle: string;
        source_table: string;
        saved_value_tzs: string;
        created_at: Date;
      }[]
    >(
      `SELECT ledger_id, principle, source_table, saved_value_tzs, created_at
       FROM saving_ledger
       WHERE member_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId],
    );

    const resourceConversion = byPrinciple.find(
      (row) => row.principle === 'RESOURCE_CONVERSION',
    );
    const transactionDiversion = byPrinciple.find(
      (row) => row.principle === 'TRANSACTION_DIVERSION',
    );

    return {
      totalSavedTzs: byPrinciple.reduce(
        (sum, row) => sum + Number(row.total),
        0,
      ),
      resourceConversion: {
        count: resourceConversion?.count ?? 0,
        totalSavedTzs: resourceConversion
          ? Number(resourceConversion.total)
          : 0,
      },
      transactionDiversion: {
        count: transactionDiversion?.count ?? 0,
        totalSavedTzs: transactionDiversion
          ? Number(transactionDiversion.total)
          : 0,
      },
      recent: recent.map((row) => ({
        ledgerId: row.ledger_id,
        principle: row.principle,
        source: row.source_table,
        savedValueTzs: Number(row.saved_value_tzs),
        createdAt: row.created_at,
      })),
    };
  }

  // Absence of a member_saving_consents row means "consented" (the
  // 2026-09-02 product decision: every existing and new member starts
  // opted in, so this only ever needs to represent an explicit opt-out).
  async getSavingConsent(userId: number) {
    const [row] = await this.dataSource.query<
      { consented: boolean; updated_at: Date }[]
    >(
      `SELECT consented, updated_at FROM member_saving_consents WHERE member_id = $1`,
      [userId],
    );

    return {
      consented: row ? row.consented : true,
      updatedAt: row?.updated_at ?? null,
    };
  }

  async updateSavingConsent(
    userId: number,
    data: UpdateSavingConsentDto,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO member_saving_consents (member_id, consented, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (member_id) DO UPDATE SET consented = $2, updated_at = NOW()`,
        [userId, data.consented],
      );

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'member.saving_consent_update',
        affectedTable: 'member_saving_consents',
        affectedRecordId: userId,
        newValue: { consented: data.consented },
        ipAddress,
      });

      return { consented: data.consented };
    });
  }

  // =====================================================
  // Manage phone numbers — set primary. Adding was already supported;
  // this is the other "Manage phone numbers" action from the Member
  // dashboard spec. Removing a linked number is deliberately left out —
  // it's a contribution source (see wallet top-up), so unlinking it needs
  // its own care later rather than a same-pass addition here.
  // =====================================================

  async setPrimaryPhoneNumber(
    userId: number,
    phoneId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const phone = await manager.findOne(PhoneNumber, { where: { phoneId } });

      if (!phone) {
        throw new NotFoundException('Phone number not found');
      }

      if (phone.userId !== userId) {
        throw new ForbiddenException(
          'That phone number does not belong to you',
        );
      }

      if (phone.isPrimary) {
        return phone;
      }

      await manager.update(
        PhoneNumber,
        { userId, isPrimary: true },
        { isPrimary: false },
      );

      phone.isPrimary = true;

      const saved = await manager.save(PhoneNumber, phone);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'phone_number.set_primary',
        affectedTable: 'phone_numbers',
        affectedRecordId: saved.phoneId,
        newValue: { phoneNumber: saved.phoneNumber },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Primary phone number updated',
        message: `${saved.phoneNumber} is now your primary phone number.`,
      });

      return saved;
    });
  }

  // =====================================================
  // My Insurance — the member's own policies (member_insurance), each
  // joined out to its plan and provider. Backs the "Health Fund Status"
  // coverage bullets and the insurance/plans frontend page.
  // =====================================================

  async listInsurance(userId: number) {
    return this.dataSource.query<MemberInsurancePolicy[]>(
      `SELECT
         mi.member_insurance_id,
         mi.policy_number,
         mi.start_date,
         mi.end_date,
         mi.policy_status,
         ip.plan_id,
         ip.plan_name,
         ip.premium_amount,
         ip.coverage_amount,
         ipr.provider_id,
         ipr.provider_name
       FROM member_insurance mi
       INNER JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       INNER JOIN insurance_providers ipr ON ipr.provider_id = ip.provider_id
       WHERE mi.member_id = $1
       ORDER BY mi.start_date DESC`,
      [userId],
    );
  }

  // Backs the dashboard's allocation-by-provider pie chart — Tujitunze
  // Insurance (the auto-enrollment fallback) is just another
  // provider_name here, not special-cased, since insurance_allocations
  // never distinguishes it from an external provider. Scoped to
  // 'Allocated' only (not Pending/Failed/Reversed) so this reads as
  // "where my money actually ended up", not every attempt ever made.
  async getInsuranceAllocationsSummary(userId: number) {
    const items = await this.dataSource.query<
      { provider_name: string; count: number; total_tzs: string }[]
    >(
      `SELECT ipr.provider_name, COUNT(*)::int AS count, COALESCE(SUM(ia.amount), 0) AS total_tzs
       FROM insurance_allocations ia
       JOIN insurance_providers ipr ON ipr.provider_id = ia.insurance_provider_id
       WHERE ia.member_id = $1 AND ia.allocation_status = 'Allocated'
       GROUP BY ipr.provider_name
       ORDER BY total_tzs DESC`,
      [userId],
    );

    return {
      items: items.map((row) => ({
        providerName: row.provider_name,
        count: row.count,
        totalTzs: Number(row.total_tzs),
      })),
    };
  }

  // =====================================================
  // Claims — the member's own healthcare_claims, joined out to the
  // hospital name for historical context. Read-only: the Hospital role
  // that used to raise/submit claims has been removed (see
  // insurance.service.ts for the Insurance-side status review that
  // replaced it), so this table is frozen — existing rows still read
  // back, but nothing writes new ones anymore.
  // =====================================================

  async listClaims(userId: number) {
    return this.dataSource.query<MemberClaim[]>(
      `SELECT
         c.claim_id,
         c.claim_number,
         c.claim_amount,
         c.approved_amount,
         c.claim_status,
         c.claim_date,
         c.processed_date,
         c.remarks,
         h.hospital_id,
         h.hospital_name
       FROM healthcare_claims c
       INNER JOIN hospitals h ON h.hospital_id = c.hospital_id
       WHERE c.member_id = $1
       ORDER BY c.claim_date DESC`,
      [userId],
    );
  }

  // =====================================================
  // Eligibility verification history — the member's own
  // healthcare_verifications, joined out to the hospital name for
  // historical context. Same frozen-table shape as Claims above: the
  // Hospital role that used to write check-in verifications here has
  // been removed, so existing rows still read back but nothing writes
  // new ones anymore.
  // =====================================================

  async listVerifications(userId: number) {
    return this.dataSource.query<MemberVerification[]>(
      `SELECT
         v.verification_id,
         v.verification_method,
         v.verification_result,
         v.member_status,
         v.verified_date,
         v.remarks,
         h.hospital_id,
         h.hospital_name
       FROM healthcare_verifications v
       INNER JOIN hospitals h ON h.hospital_id = v.hospital_id
       WHERE v.member_id = $1
       ORDER BY v.verified_date DESC`,
      [userId],
    );
  }
}
