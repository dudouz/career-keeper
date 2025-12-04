CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"github_pat" text,
	"openai_api_key" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "email" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;