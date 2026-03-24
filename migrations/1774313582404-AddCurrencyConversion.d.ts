import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddCurrencyConversion1774313582404 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
