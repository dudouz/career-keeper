CREATE TABLE "resume_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_id" uuid NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"position" text NOT NULL,
	"company" text NOT NULL,
	"description" text NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "git" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "linkedin" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "resume_sections" ADD CONSTRAINT "resume_sections_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resume_sections_resume_id_index" ON "resume_sections" USING btree ("resume_id");