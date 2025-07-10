import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'api_recorder',

  entities: ['src/**/*.entity.ts', '!src/**/*.spec.ts', '!src/**/*.test.ts'],

  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: ['error', 'warn', 'migration'],
  migrationsRun: false,
  dropSchema: false,
});

export default AppDataSource;
