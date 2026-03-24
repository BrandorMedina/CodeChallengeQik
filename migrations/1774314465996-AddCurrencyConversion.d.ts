import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddCurrencyConversion1774314465996 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
