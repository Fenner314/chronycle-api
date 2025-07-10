# Database Migrations

This folder contains TypeORM database migrations for the Chronycle API.

## Available Commands

### Generate a new migration

```bash
npm run migration:generate src/migrations/MigrationName
```

### Run pending migrations

```bash
npm run migration:run
```

### Revert the last migration

```bash
npm run migration:revert
```

### Show migration status

```bash
npm run migration:show
```

## Migration Naming Convention

Migrations should be named with a timestamp prefix followed by a descriptive name:

- Format: `YYYYMMDDHHMMSS-DescriptiveName.ts`
- Example: `1710000000000-RenameRecordedRequestToRequest.ts`

## Migration Structure

Each migration file should:

1. Import `MigrationInterface` and `QueryRunner` from TypeORM
2. Implement the `MigrationInterface`
3. Include both `up()` and `down()` methods
4. Use the `name` property for identification

## Example Migration

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExampleMigration1710000000000 implements MigrationInterface {
  name = 'ExampleMigration1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migration logic here
    await queryRunner.query(
      `CREATE TABLE "example" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4())`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic here
    await queryRunner.query(`DROP TABLE "example"`);
  }
}
```

## Important Notes

- Always test migrations in a development environment first
- Ensure the `down()` method properly reverts all changes made in `up()`
- Use transactions when possible for complex migrations
- Keep migrations small and focused on a single change
- Never modify existing migration files that have been applied to production

## Configuration

The migration configuration is in `src/migrations/ormconfig.ts` and uses the same environment variables as the main application.
