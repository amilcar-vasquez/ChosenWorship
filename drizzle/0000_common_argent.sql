CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` integer NOT NULL,
	`time` text,
	`location` text,
	`description` text,
	`setlist_id` text,
	`event_type` text DEFAULT 'service',
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`setlist_id`) REFERENCES `setlists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`service_id` text,
	`setlist_id` text,
	`target_date` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`assigned_to` text NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `recurring_services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`setlist_id`) REFERENCES `setlists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recurring_services` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`time` text NOT NULL,
	`location` text,
	`type` text NOT NULL,
	`setlist_reminder_days` integer DEFAULT 3,
	`team_reminder_days` integer DEFAULT 1,
	`active` integer DEFAULT true,
	`default_duration` integer DEFAULT 90,
	`required_roles` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `setlist_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`setlist_id` text NOT NULL,
	`song_id` text NOT NULL,
	`section` text NOT NULL,
	`order` integer NOT NULL,
	`preferred_key` text,
	`transposition` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`setlist_id`) REFERENCES `setlists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `setlist_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`service_type` text NOT NULL,
	`structure` text NOT NULL,
	`total_songs` integer NOT NULL,
	`praise_songs` integer DEFAULT 0,
	`worship_songs` integer DEFAULT 0,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `setlists` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` integer NOT NULL,
	`service_id` text,
	`praise_leader` text,
	`worship_leader` text,
	`musical_director` text,
	`status` text DEFAULT 'draft',
	`estimated_duration` integer,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `recurring_services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`praise_leader`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worship_leader`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`musical_director`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`original_key` text NOT NULL,
	`lyrics_url` text,
	`chords_url` text,
	`tags` text,
	`language` text DEFAULT 'en',
	`tempo` integer,
	`category` text,
	`duration` integer,
	`usage_count` integer DEFAULT 0,
	`last_used` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_availability` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` integer NOT NULL,
	`available` integer DEFAULT true,
	`notes` text,
	`service_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `recurring_services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_song_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`song_id` text NOT NULL,
	`preferred_note` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`instruments` text,
	`roles` text,
	`default_preferred_note` text,
	`avatar` text,
	`phone` text,
	`emergency_contact` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
