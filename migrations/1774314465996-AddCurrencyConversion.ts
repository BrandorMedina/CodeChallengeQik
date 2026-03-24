import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyConversion1774314465996 implements MigrationInterface {
    name = 'AddCurrencyConversion1774314465996'

    public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE "transactions" ADD IF NOT EXISTS "rate_type" character varying(10)`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_destination_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD IF NOT EXISTS "destination_currency" "public"."transactions_destination_currency_enum"`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" ADD IF NOT EXISTS "buy_rate" numeric(18,6) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" ADD IF NOT EXISTS "sell_rate" numeric(18,6) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" ADD IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" ADD IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN IF EXISTS "updated_at"`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN IF EXISTS "is_active"`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN "sell_rate"`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN "buy_rate"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "destination_currency"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_destination_currency_enum"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "rate_type"`);
    }

}
