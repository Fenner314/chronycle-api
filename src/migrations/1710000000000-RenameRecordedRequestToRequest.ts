import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRecordedRequestToRequest1710000000000
  implements MigrationInterface
{
  name = 'RenameRecordedRequestToRequest1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'recorded_requests' AND column_name = 'userId'
    `)) as { column_name: string }[];

    if (columns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "recorded_requests" 
        ADD COLUMN "userId" uuid
      `);

      const users = (await queryRunner.query(
        `SELECT id FROM "users" LIMIT 1`,
      )) as {
        id: string;
      }[];

      if (users.length > 0) {
        const defaultUserId = users[0].id;
        await queryRunner.query(`
          UPDATE "recorded_requests" 
          SET "userId" = '${defaultUserId}' 
          WHERE "userId" IS NULL
        `);
      }

      await queryRunner.query(`
        ALTER TABLE "recorded_requests" 
        ALTER COLUMN "userId" SET NOT NULL
      `);
    }

    await queryRunner.query(
      `ALTER TABLE "recorded_requests" RENAME TO "requests"`,
    );

    await queryRunner.query(`
      ALTER TABLE "requests" 
      ADD CONSTRAINT "FK_requests_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_requests_userId" ON "requests" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_requests_user"`,
    );

    await queryRunner.query(`DROP INDEX "IDX_requests_userId"`);

    await queryRunner.query(
      `ALTER TABLE "requests" RENAME TO "recorded_requests"`,
    );
  }
}
