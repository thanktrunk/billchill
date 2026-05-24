ALTER TABLE "expenses" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_group_members_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;