CREATE TABLE "provider_avatar" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"image_url" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provider_avatar_user_provider" UNIQUE("user_id","provider_id")
);
--> statement-breakpoint
ALTER TABLE "provider_avatar" ADD CONSTRAINT "provider_avatar_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;