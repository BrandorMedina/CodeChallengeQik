import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyConversion1774313582404 implements MigrationInterface {
    name = 'AddCurrencyConversion1774313582404'

    public async up(queryRunner: QueryRunner): Promise<void> {
  // 1. Agregar columnas como nullable primero
  await queryRunner.query(`ALTER TABLE "exchange_rates" ADD "buy_rate" numeric(18,6)`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ADD "sell_rate" numeric(18,6)`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ADD "is_active" boolean`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ADD "updated_at" TIMESTAMP`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ADD "rate_type" character varying(10)`);

  // 2. Limpiar filas viejas — el seed las va a recrear correctamente
  await queryRunner.query(`DELETE FROM "exchange_rates"`);

  // 3. Hacer las columnas NOT NULL ahora que están vacías
  await queryRunner.query(`ALTER TABLE "exchange_rates" ALTER COLUMN "buy_rate" SET NOT NULL`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ALTER COLUMN "sell_rate" SET NOT NULL`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ALTER COLUMN "is_active" SET DEFAULT true`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ALTER COLUMN "is_active" SET NOT NULL`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ALTER COLUMN "updated_at" SET DEFAULT now()`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ALTER COLUMN "updated_at" SET NOT NULL`);

  // 4. Eliminar la columna "rate" vieja si existe
  await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN IF EXISTS "rate"`);

  // 5. Agregar columnas nuevas a transactions si no las tiene ya
  await queryRunner.query(`ALTER TABLE "transactions" ADD IF NOT EXISTS "rate_type" character varying(10)`);
  await queryRunner.query(`ALTER TABLE "transactions" ADD IF NOT EXISTS "destination_currency" character varying`);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "destination_currency"`);
  await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "rate_type"`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" ADD "rate" numeric(18,6)`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN IF EXISTS "updated_at"`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN IF EXISTS "is_active"`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN IF EXISTS "sell_rate"`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN IF EXISTS "buy_rate"`);
  await queryRunner.query(`ALTER TABLE "exchange_rates" DROP COLUMN IF EXISTS "rate_type"`);
}

}
