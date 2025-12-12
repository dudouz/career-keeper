ALTER TABLE "brags" RENAME TO "achievements";--> statement-breakpoint
ALTER TABLE "achievements" DROP CONSTRAINT "brags_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "achievements" DROP CONSTRAINT "brags_resume_section_id_resume_sections_id_fk";
--> statement-breakpoint
DROP INDEX "brags_user_id_index";--> statement-breakpoint
DROP INDEX "brags_review_status_index";--> statement-breakpoint
DROP INDEX "brags_github_unique_index";--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_resume_section_id_resume_sections_id_fk" FOREIGN KEY ("resume_section_id") REFERENCES "public"."resume_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_user_id_index" ON "achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "achievements_review_status_index" ON "achievements" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "achievements_github_unique_index" ON "achievements" USING btree ("user_id","github_id","github_type");