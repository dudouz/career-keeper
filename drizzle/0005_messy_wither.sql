CREATE TABLE "brags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"repository" text NOT NULL,
	"url" text NOT NULL,
	"github_id" text,
	"github_type" text NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"relevance" integer,
	"resume_section_id" uuid,
	"tech_tags" text[],
	"custom_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "brags" ADD CONSTRAINT "brags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brags" ADD CONSTRAINT "brags_resume_section_id_resume_sections_id_fk" FOREIGN KEY ("resume_section_id") REFERENCES "public"."resume_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brags_user_id_index" ON "brags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "brags_review_status_index" ON "brags" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "brags_github_unique_index" ON "brags" USING btree ("user_id","github_id","github_type");