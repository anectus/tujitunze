import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ClaimListItem {
  claimId: number;
  claimStatus: string;
}

interface Settlement {
  settlement_id: number;
  counterparty_name: string;
  settlement_status: string;
}

// Proves the tenant-isolation boundary the Insurance module's new
// claims-review/settlements surface relies on — the same shape as the
// removed Hospital module's own tenant-scoping test: provider A must
// never see provider B's claims, an unassigned Insurance account is
// rejected, and reviewing a claim actually persists the status change.
describe('Insurance claims & settlements (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdProviderIds: number[] = [];
  const createdPlanIds: number[] = [];
  const createdPolicyIds: number[] = [];
  const createdClaimIds: number[] = [];
  const createdHospitalIds: number[] = [];
  const createdBankIds: number[] = [];
  const createdSettlementIds: number[] = [];

  let memberUserId: number;
  let providerAId: number;
  let providerBId: number;
  let staffAId: number;
  let staffBId: number;
  let unassignedStaffId: number;
  let claimAId: number;

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-02`;

  const signToken = (userId: number, roles: string[], firstName: string) =>
    jwtService.sign({ sub: userId, roles, firstName });

  const createUser = async (
    firstName: string,
    nidaIndex: number,
  ): Promise<number> => {
    const [row] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (first_name, surname, nida_number, password_hash, member_status)
       VALUES ($1, 'E2E', $2, 'x', 'Active')
       RETURNING user_id`,
      [firstName, nida(nidaIndex)],
    );
    createdUserIds.push(row.user_id);
    return row.user_id;
  };

  const assignRole = async (userId: number, roleName: string) => {
    await dataSource.query(
      `INSERT INTO member_roles (member_id, role_id)
       SELECT $1, role_id FROM roles WHERE role_name = $2`,
      [userId, roleName],
    );
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = app.get(JwtService);
    dataSource = app.get(DataSource);

    const providers = await dataSource.query<{ provider_id: number }[]>(
      `INSERT INTO insurance_providers (provider_name, status)
       VALUES ($1, 'Active'), ($2, 'Active')
       RETURNING provider_id`,
      [`E2E Insurance Provider A ${ts}`, `E2E Insurance Provider B ${ts}`],
    );
    providerAId = providers[0].provider_id;
    providerBId = providers[1].provider_id;
    createdProviderIds.push(providerAId, providerBId);

    const [planA] = await dataSource.query<{ plan_id: number }[]>(
      `INSERT INTO insurance_plans (provider_id, plan_name, status)
       VALUES ($1, $2, 'Active') RETURNING plan_id`,
      [providerAId, `E2E Plan A ${ts}`],
    );
    createdPlanIds.push(planA.plan_id);

    memberUserId = await createUser('Member', 1);
    await assignRole(memberUserId, 'Member');

    const [policy] = await dataSource.query<{ member_insurance_id: number }[]>(
      `INSERT INTO member_insurance (member_id, plan_id, policy_number, start_date, policy_status)
       VALUES ($1, $2, $3, CURRENT_DATE, 'Active') RETURNING member_insurance_id`,
      [memberUserId, planA.plan_id, `E2E-POLICY-${ts}`],
    );
    createdPolicyIds.push(policy.member_insurance_id);

    // healthcare_claims.hospital_id stays NOT NULL — hospitals is kept as
    // a frozen historical/reference table, not dropped.
    const [hospital] = await dataSource.query<{ hospital_id: number }[]>(
      `INSERT INTO hospitals (hospital_name, status) VALUES ($1, 'Active') RETURNING hospital_id`,
      [`E2E Historical Hospital ${ts}`],
    );
    createdHospitalIds.push(hospital.hospital_id);

    const [claimA] = await dataSource.query<{ claim_id: number }[]>(
      `INSERT INTO healthcare_claims (member_id, hospital_id, member_insurance_id, claim_number, claim_amount, claim_status)
       VALUES ($1, $2, $3, $4, 500, 'Pending') RETURNING claim_id`,
      [
        memberUserId,
        hospital.hospital_id,
        policy.member_insurance_id,
        `E2E-CLAIM-${ts}`,
      ],
    );
    claimAId = claimA.claim_id;
    createdClaimIds.push(claimAId);

    staffAId = await createUser('InsuranceStaffA', 2);
    await assignRole(staffAId, 'Insurance');
    await dataSource.query(
      `UPDATE users SET insurance_provider_id = $1 WHERE user_id = $2`,
      [providerAId, staffAId],
    );

    staffBId = await createUser('InsuranceStaffB', 3);
    await assignRole(staffBId, 'Insurance');
    await dataSource.query(
      `UPDATE users SET insurance_provider_id = $1 WHERE user_id = $2`,
      [providerBId, staffBId],
    );

    unassignedStaffId = await createUser('UnassignedInsuranceStaff', 4);
    await assignRole(unassignedStaffId, 'Insurance');

    const [bank] = await dataSource.query<{ bank_id: number }[]>(
      `INSERT INTO banks (bank_name, status) VALUES ($1, 'Active') RETURNING bank_id`,
      [`E2E Settlement Bank ${ts}`],
    );
    createdBankIds.push(bank.bank_id);

    const [settlement] = await dataSource.query<{ settlement_id: number }[]>(
      `INSERT INTO settlements (bank_id, counterparty_type, counterparty_name, insurance_provider_id, amount, settlement_status)
       VALUES ($1, 'Insurance', $2, $3, 1000, 'Completed') RETURNING settlement_id`,
      [bank.bank_id, `E2E Provisioning Insurance ${ts}`, providerAId],
    );
    createdSettlementIds.push(settlement.settlement_id);
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM settlements WHERE settlement_id = ANY($1)`,
      [createdSettlementIds],
    );
    await dataSource.query(`DELETE FROM banks WHERE bank_id = ANY($1)`, [
      createdBankIds,
    ]);
    await dataSource.query(
      `DELETE FROM healthcare_claims WHERE claim_id = ANY($1)`,
      [createdClaimIds],
    );
    await dataSource.query(
      `DELETE FROM hospitals WHERE hospital_id = ANY($1)`,
      [createdHospitalIds],
    );
    await dataSource.query(
      `DELETE FROM member_insurance WHERE member_insurance_id = ANY($1)`,
      [createdPolicyIds],
    );
    await dataSource.query(
      `DELETE FROM insurance_plans WHERE plan_id = ANY($1)`,
      [createdPlanIds],
    );
    await dataSource.query(
      `DELETE FROM member_roles WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM audit_logs WHERE member_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(
      `DELETE FROM insurance_providers WHERE provider_id = ANY($1)`,
      [createdProviderIds],
    );
    await app.close();
  });

  it('rejects Insurance staff with no provider assigned', async () => {
    const token = signToken(
      unassignedStaffId,
      ['Insurance'],
      'UnassignedInsuranceStaff',
    );

    await request(app.getHttpServer())
      .get('/insurance/claims')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it("provider A's staff sees the claim routed to provider A", async () => {
    const token = signToken(staffAId, ['Insurance'], 'InsuranceStaffA');

    const response = await request(app.getHttpServer())
      .get('/insurance/claims')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const claims = response.body as ClaimListItem[];
    expect(claims.some((c) => c.claimId === claimAId)).toBe(true);
  });

  it("provider B's staff never sees provider A's claim", async () => {
    const token = signToken(staffBId, ['Insurance'], 'InsuranceStaffB');

    const response = await request(app.getHttpServer())
      .get('/insurance/claims')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const claims = response.body as ClaimListItem[];
    expect(claims.some((c) => c.claimId === claimAId)).toBe(false);
  });

  it("rejects provider B's staff approving provider A's claim", async () => {
    const token = signToken(staffBId, ['Insurance'], 'InsuranceStaffB');

    await request(app.getHttpServer())
      .patch(`/insurance/claims/${claimAId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ claimStatus: 'Approved' })
      .expect(404);
  });

  it("provider A's staff can approve their own claim", async () => {
    const token = signToken(staffAId, ['Insurance'], 'InsuranceStaffA');

    const response = await request(app.getHttpServer())
      .patch(`/insurance/claims/${claimAId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ claimStatus: 'Approved', approvedAmount: 450 })
      .expect(200);

    const updated = response.body as ClaimListItem;
    expect(updated.claimStatus).toBe('Approved');
  });

  it("provider A's staff sees the settlement allocated to provider A", async () => {
    const token = signToken(staffAId, ['Insurance'], 'InsuranceStaffA');

    const response = await request(app.getHttpServer())
      .get('/insurance/settlements')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const settlements = response.body as Settlement[];
    expect(
      settlements.some((s) => createdSettlementIds.includes(s.settlement_id)),
    ).toBe(true);
  });

  it("provider B's staff never sees provider A's settlement", async () => {
    const token = signToken(staffBId, ['Insurance'], 'InsuranceStaffB');

    const response = await request(app.getHttpServer())
      .get('/insurance/settlements')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const settlements = response.body as Settlement[];
    expect(
      settlements.some((s) => createdSettlementIds.includes(s.settlement_id)),
    ).toBe(false);
  });
});
