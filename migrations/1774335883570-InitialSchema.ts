import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1774335883570 implements MigrationInterface {
    name = 'InitialSchema1774335883570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "phone" character varying(20), "document_id" character varying(50) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b48860677afe62cd96e12659482" UNIQUE ("email"), CONSTRAINT "UQ_6af6d88d20b5f2a5704fe5edc45" UNIQUE ("document_id"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_number" character varying(20) NOT NULL, "balance" numeric(18,2) NOT NULL DEFAULT '0', "currency" "public"."accounts_currency_enum" NOT NULL, "status" "public"."accounts_status_enum" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "client_id" uuid NOT NULL, CONSTRAINT "UQ_ffd1ae96513bfb2c6eada0f7d31" UNIQUE ("account_number"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_destination_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."transactions_type_enum" NOT NULL, "amount" numeric(18,2) NOT NULL, "currency" "public"."transactions_currency_enum" NOT NULL, "exchange_rate" numeric(18,6), "converted_amount" numeric(18,2), "rate_type" character varying(10), "destination_currency" "public"."transactions_destination_currency_enum", "description" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "source_account_id" uuid NOT NULL, "destination_account_id" uuid, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."currencies_code_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TABLE "currencies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" "public"."currencies_code_enum" NOT NULL, "name" character varying(50) NOT NULL, "symbol" character varying(5) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9f8d0972aeeb5a2277e40332d29" UNIQUE ("code"), CONSTRAINT "PK_d528c54860c4182db13548e08c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exchange_rates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buy_rate" numeric(18,6) NOT NULL, "sell_rate" numeric(18,6) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "from_currency_id" uuid, "to_currency_id" uuid, CONSTRAINT "PK_33a614bad9e61956079d817ebe2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_099611aae88727aaa8369983f02" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_a008a672b1acca7f679de9f2a2a" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_98c19d7f096b4ab011d3547eb0d" FOREIGN KEY ("destination_account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" ADD CONSTRAINT "FK_b2ef436f4da7ada3cf6b5c27f4c" FOREIGN KEY ("from_currency_id") REFERENCES "currencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" ADD CONSTRAINT "FK_437913540d381a4e268a682ee94" FOREIGN KEY ("to_currency_id") REFERENCES "currencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exchange_rates" DROP CONSTRAINT "FK_437913540d381a4e268a682ee94"`);
        await queryRunner.query(`ALTER TABLE "exchange_rates" DROP CONSTRAINT "FK_b2ef436f4da7ada3cf6b5c27f4c"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_98c19d7f096b4ab011d3547eb0d"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_a008a672b1acca7f679de9f2a2a"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_099611aae88727aaa8369983f02"`);
        await queryRunner.query(`DROP TABLE "exchange_rates"`);
        await queryRunner.query(`DROP TABLE "currencies"`);
        await queryRunner.query(`DROP TYPE "public"."currencies_code_enum"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_destination_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_currency_enum"`);
        await queryRunner.query(`DROP TABLE "clients"`);
    }

}
