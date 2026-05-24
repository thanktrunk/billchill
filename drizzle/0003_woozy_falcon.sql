ALTER TABLE "groups" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "invite_token" varchar(64);--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_invite_token_unique" UNIQUE("invite_token");