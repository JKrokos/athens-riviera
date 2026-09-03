import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "areas" ADD COLUMN "content" jsonb;
  ALTER TABLE "posts" ADD COLUMN "area_id" integer;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "posts_area_idx" ON "posts" USING btree ("area_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP CONSTRAINT "posts_area_id_areas_id_fk";
  
  DROP INDEX "posts_area_idx";
  ALTER TABLE "areas" DROP COLUMN "content";
  ALTER TABLE "posts" DROP COLUMN "area_id";`)
}
