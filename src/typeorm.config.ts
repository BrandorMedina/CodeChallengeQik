import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const isCompiled = __dirname.includes('dist');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'banco_digital',

  entities: [
    isCompiled
      ? join(__dirname, '**/*.entity.js')
      : join(__dirname, '**/*.entity.ts'),
  ],

  migrations: [
    isCompiled
      ? join(__dirname, 'migrations/*.js')
      : join(__dirname, 'migrations/*.ts'),
  ],

  migrationsTableName: 'migrations_history',
});