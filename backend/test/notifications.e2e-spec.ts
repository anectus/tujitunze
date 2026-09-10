import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the Notifications module's read/read-all/delete endpoints hold
// end to end against a running app: readAt/deletedAt persist correctly
// (migration 0031), a soft-deleted notification disappears from the list
// and 404s on further action, and a member can't touch another member's
// notification.
describe('Member notifications (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];

  let seqCounter = 0;
  // 3-digit operator prefix + a unique 7-digit suffix derived from the
  // run timestamp and an incrementing counter, matching the
  // ^0[67][0-9]{8}$ phone_numbers CHECK constraint (10 chars total) —
  // same helper members-account-rules.e2e-spec.ts uses.
  const mkPhone = (prefix: string): string => {
    seqCounter += 1;
    const base = `${ts}${String(seqCounter).padStart(4, '0')}`;
    return `${prefix}${base.slice(-7)}`;
  };

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-09`;

  const signToken = (userId: number, firstName: string) =>
    jwtService.sign({ sub: userId, roles: ['Member'], firstName });

  // Registers a real member, completes onboarding's gender/region step,
  // then links a second phone number (a different operator than the
  // registration SIM, to stay inside the one-Standard-SIM-per-operator
  // rule) — that call is what actually creates a real 'Phone number
  // linked' notification (see MembersService.addPhoneNumber), giving
  // each test a real row to act on rather than an inserted fixture.
  const createMemberWithNotification = async (
    firstName: string,
    nidaIndex: number,
  ) => {
    const registerResponse = await request(app.getHttpServer())
      .post('/members/register')
      .send({
        firstName,
        surname: 'E2E',
        phoneNumber: mkPhone('073'),
        nidaNumber: nida(nidaIndex),
        password: 'Passw0rd!123',
      });

    expect(registerResponse.status).toBe(201);

    const userId: number = registerResponse.body.member.userId;
    createdUserIds.push(userId);

    const token = signToken(userId, firstName);
    const authHeader = `Bearer ${token}`;

    const profileResponse = await request(app.getHttpServer())
      .patch('/members/me')
      .set('Authorization', authHeader)
      .send({ gender: 'Male', region: 'Dar es Salaam' });

    expect(profileResponse.status).toBe(200);

    const phoneResponse = await request(app.getHttpServer())
      .post('/members/phone-numbers')
      .set('Authorization', authHeader)
      .send({ phoneNumber: mkPhone('074') });

    expect(phoneResponse.status).toBe(201);

    return { userId, token, authHeader };
  };

  const latestNotificationId = async (
    authHeader: string,
  ): Promise<number> => {
    const listResponse = await request(app.getHttpServer())
      .get('/members/notifications')
      .set('Authorization', authHeader);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBeGreaterThan(0);

    return listResponse.body.items[0].notificationId;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = app.get(JwtService);
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (createdUserIds.length) {
      // phone_numbers/notifications cascade on user delete, but
      // audit_logs.member_id is NO ACTION (see AuditLogsService), so
      // that has to go first or the DELETE below hits a foreign-key
      // violation — same cleanup members-account-rules.e2e-spec.ts uses.
      await dataSource.query(
        `DELETE FROM audit_logs WHERE member_id = ANY($1)`,
        [createdUserIds],
      );
      await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
        createdUserIds,
      ]);
    }
    await app.close();
  });

  it('marks a notification read, sets readAt once, and is idempotent on re-read', async () => {
    const { authHeader } = await createMemberWithNotification(
      'NotifyReadMember',
      1,
    );
    const notificationId = await latestNotificationId(authHeader);

    const firstRead = await request(app.getHttpServer())
      .patch(`/members/notifications/${notificationId}/read`)
      .set('Authorization', authHeader);

    expect(firstRead.status).toBe(200);
    expect(firstRead.body.readStatus).toBe(true);
    expect(firstRead.body.readAt).not.toBeNull();

    const firstReadAt = firstRead.body.readAt;

    const secondRead = await request(app.getHttpServer())
      .patch(`/members/notifications/${notificationId}/read`)
      .set('Authorization', authHeader);

    expect(secondRead.status).toBe(200);
    // readAt is set once — re-reading an already-read notification must
    // not move it forward.
    expect(secondRead.body.readAt).toBe(firstReadAt);
  });

  it('marks every unread notification read via read-all', async () => {
    const { authHeader } = await createMemberWithNotification(
      'NotifyReadAllMember',
      2,
    );

    const beforeList = await request(app.getHttpServer())
      .get('/members/notifications')
      .set('Authorization', authHeader);

    expect(beforeList.body.unreadCount).toBeGreaterThan(0);

    const readAll = await request(app.getHttpServer())
      .patch('/members/notifications/read-all')
      .set('Authorization', authHeader);

    expect(readAll.status).toBe(200);

    const afterList = await request(app.getHttpServer())
      .get('/members/notifications')
      .set('Authorization', authHeader);

    expect(afterList.body.unreadCount).toBe(0);
    expect(
      afterList.body.items.every(
        (item: { readStatus: boolean; readAt: string | null }) =>
          item.readStatus && item.readAt !== null,
      ),
    ).toBe(true);
  });

  it('soft-deletes a notification: it disappears from the list and further action 404s', async () => {
    const { authHeader } = await createMemberWithNotification(
      'NotifyDeleteMember',
      3,
    );
    const notificationId = await latestNotificationId(authHeader);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/members/notifications/${notificationId}`)
      .set('Authorization', authHeader);

    expect(deleteResponse.status).toBe(200);

    const listAfterDelete = await request(app.getHttpServer())
      .get('/members/notifications')
      .set('Authorization', authHeader);

    expect(
      listAfterDelete.body.items.some(
        (item: { notificationId: number }) =>
          item.notificationId === notificationId,
      ),
    ).toBe(false);

    // Deleted rows are gone as far as the member is concerned — a second
    // delete, or a mark-read, both 404 rather than silently succeeding.
    const secondDelete = await request(app.getHttpServer())
      .delete(`/members/notifications/${notificationId}`)
      .set('Authorization', authHeader);

    expect(secondDelete.status).toBe(404);

    const readAfterDelete = await request(app.getHttpServer())
      .patch(`/members/notifications/${notificationId}/read`)
      .set('Authorization', authHeader);

    expect(readAfterDelete.status).toBe(404);

    const rows = await dataSource.query<{ deleted_at: Date | null }[]>(
      `SELECT deleted_at FROM notifications WHERE notification_id = $1`,
      [notificationId],
    );

    expect(rows[0].deleted_at).not.toBeNull();
  });

  it('rejects reading or deleting another member\'s notification', async () => {
    const owner = await createMemberWithNotification('NotifyOwnerMember', 4);
    const stranger = await createMemberWithNotification(
      'NotifyStrangerMember',
      5,
    );

    const ownerNotificationId = await latestNotificationId(owner.authHeader);

    const strangerRead = await request(app.getHttpServer())
      .patch(`/members/notifications/${ownerNotificationId}/read`)
      .set('Authorization', stranger.authHeader);

    expect(strangerRead.status).toBe(403);

    const strangerDelete = await request(app.getHttpServer())
      .delete(`/members/notifications/${ownerNotificationId}`)
      .set('Authorization', stranger.authHeader);

    expect(strangerDelete.status).toBe(403);
  });
});
