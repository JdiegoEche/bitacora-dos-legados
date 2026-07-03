CREATE TABLE `brew_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coffee_bean_id` integer,
	`user_id` integer NOT NULL,
	`grind_size` text,
	`water_temp` integer,
	`brew_time` integer,
	`method` text NOT NULL,
	`grinder` text,
	`clicks` text,
	`coffee_dose` real,
	`water_dose` real,
	`notes` text,
	`rating` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`coffee_bean_id`) REFERENCES `coffee_beans`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `coffee_beans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`roaster` text NOT NULL,
	`origin` text,
	`roast_level` text,
	`user_id` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `magic_link_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`method` text NOT NULL,
	`name` text NOT NULL,
	`objective` text,
	`preparation` text NOT NULL,
	`coffee_dose` real NOT NULL,
	`water_dose` real NOT NULL,
	`ratio` text NOT NULL,
	`temperature` text NOT NULL,
	`grind_size` text NOT NULL,
	`total_time` text NOT NULL,
	`profile` text NOT NULL,
	`steps` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasting_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brew_session_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`aroma` text,
	`flavor` text,
	`body` text,
	`acidity` text,
	`rating` integer,
	`free_text` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`brew_session_id`) REFERENCES `brew_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);