// src/migrations/ReplaceUserIdWithApiKeyId.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceUserIdWithApiKeyId1673123456789
  implements MigrationInterface
{
  name = 'ReplaceUserIdWithApiKeyId1673123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, check if we have existing data
    const existingRequests = await queryRunner.query(
      `SELECT COUNT(*) as count FROM "requests"`,
    );
    const hasData = existingRequests[0].count > 0;

    if (hasData) {
      // If we have existing data, we need to either:
      // 1. Delete all existing requests (safest for development)
      // 2. Or create a mapping to existing API keys

      console.log(
        `Found ${existingRequests[0].count} existing requests. Clearing table for migration...`,
      );
      await queryRunner.query(`DELETE FROM "requests"`);
    }

    // Drop the old userId foreign key constraint and index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_request_userId"`);
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT IF EXISTS "FK_request_userId"`,
    );

    // Add the new apiKeyId column (without default)
    await queryRunner.query(`
      ALTER TABLE "requests" 
      ADD COLUMN "apiKeyId" uuid
    `);

    // Add apiId column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "requests" 
      ADD COLUMN IF NOT EXISTS "apiId" varchar
    `);

    // Since we cleared the table, we can now add NOT NULL constraints
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "apiKeyId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "apiId" SET NOT NULL`,
    );

    // Add foreign key constraint for apiKeyId
    await queryRunner.query(`
      ALTER TABLE "requests" 
      ADD CONSTRAINT "FK_requests_apiKeyId" 
      FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") 
      ON DELETE CASCADE
    `);

    // Add new indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_requests_apiKeyId" ON "requests" ("apiKeyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_requests_apiId_endpoint" ON "requests" ("apiId", "endpoint")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_requests_timestamp" ON "requests" ("timestamp")`,
    );

    // Remove the old userId column
    await queryRunner.query(
      `ALTER TABLE "requests" DROP COLUMN IF EXISTS "userId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clear data again for rollback
    await queryRunner.query(`DELETE FROM "requests"`);

    // Add back userId column
    await queryRunner.query(`
      ALTER TABLE "requests" 
      ADD COLUMN "userId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
    `);

    // Drop new constraints and indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_requests_apiKeyId"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_requests_apiId_endpoint"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_requests_timestamp"`);
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT IF EXISTS "FK_requests_apiKeyId"`,
    );

    // Remove new columns
    await queryRunner.query(
      `ALTER TABLE "requests" DROP COLUMN IF EXISTS "apiKeyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP COLUMN IF EXISTS "apiId"`,
    );

    // Add back old userId foreign key and index
    await queryRunner.query(`
      ALTER TABLE "requests" 
      ADD CONSTRAINT "FK_request_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_request_userId" ON "requests" ("userId")`,
    );

    // Drop the default constraint
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "userId" DROP DEFAULT`,
    );
  }
}
