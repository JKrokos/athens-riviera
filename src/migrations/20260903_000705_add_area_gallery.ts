import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "areas_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "site_settings" ALTER COLUMN "site_name" SET DEFAULT 'Athens Riviera';
  ALTER TABLE "site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Discover the Athens Riviera';
  ALTER TABLE "site_settings" ALTER COLUMN "hero_title" SET DEFAULT 'Discover the Athens Riviera';
  ALTER TABLE "site_settings" ALTER COLUMN "address" SET DEFAULT 'Athens Riviera, Greece';
  ALTER TABLE "areas_rels" ADD CONSTRAINT "areas_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "areas_rels" ADD CONSTRAINT "areas_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "areas_rels_order_idx" ON "areas_rels" USING btree ("order");
  CREATE INDEX "areas_rels_parent_idx" ON "areas_rels" USING btree ("parent_id");
  CREATE INDEX "areas_rels_path_idx" ON "areas_rels" USING btree ("path");
  CREATE INDEX "areas_rels_media_id_idx" ON "areas_rels" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "areas_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "areas_rels" CASCADE;
  ALTER TABLE "site_settings" ALTER COLUMN "site_name" SET DEFAULT 'Athens Best';
  ALTER TABLE "site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Discover great places in Athens';
  ALTER TABLE "site_settings" ALTER COLUMN "hero_title" SET DEFAULT 'Discover great places in Athens';
  ALTER TABLE "site_settings" ALTER COLUMN "address" SET DEFAULT 'Athens, Greece';`)
}
