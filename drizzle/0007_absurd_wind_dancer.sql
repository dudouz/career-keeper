CREATE TABLE "user_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_id" uuid,
	"github_contribution_id" uuid,
	"years_of_experience" integer,
	"seniority" text,
	"focus" text,
	"github_analysis" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "years_of_experience" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "seniority" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "focus" text;--> statement-breakpoint
ALTER TABLE "user_snapshots" ADD CONSTRAINT "user_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_snapshots" ADD CONSTRAINT "user_snapshots_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_snapshots" ADD CONSTRAINT "user_snapshots_github_contribution_id_github_contributions_id_fk" FOREIGN KEY ("github_contribution_id") REFERENCES "public"."github_contributions"("id") ON DELETE set null ON UPDATE no action;