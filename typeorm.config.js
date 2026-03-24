"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)();
const isCompiled = __dirname.includes('dist');
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'banco_digital',
    entities: [
        (0, path_1.join)(__dirname, isCompiled ? 'src' : '', '**/*.entity.{ts,js}'),
    ],
    migrations: [
        (0, path_1.join)(__dirname, isCompiled ? 'migrations' : 'migrations', '*.{ts,js}'),
    ],
    migrationsTableName: 'migrations_history',
});
//# sourceMappingURL=typeorm.config.js.map