import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("agencies", "address", "legacy_address");
  pgm.alterColumn("agencies", "legacy_address", { notNull: false });
  pgm.addColumns("agencies", {
    street_number_and_address: { type: "text", notNull: true, default: "" },
    post_code: { type: "text", notNull: true, default: "" },
    city: { type: "text", notNull: true, default: "" },
    county_code: { type: "text", notNull: true, default: "" },
  });

  pgm.alterColumn("agencies", "street_number_and_address", { default: null });
  pgm.alterColumn("agencies", "post_code", { default: null });
  pgm.alterColumn("agencies", "county_code", { default: null });
  pgm.alterColumn("agencies", "city", { default: null });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("agencies", "legacy_address", "address");
  pgm.dropColumns("agencies", [
    "street_number_and_address",
    "post_code",
    "county_code",
    "city",
  ]);
}
