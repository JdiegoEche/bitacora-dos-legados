PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_brew_sessions` (
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_brew_sessions`("id", "coffee_bean_id", "user_id", "grind_size", "water_temp", "brew_time", "method", "grinder", "clicks", "coffee_dose", "water_dose", "notes", "rating", "created_at", "updated_at") SELECT "id", "coffee_bean_id", "user_id", "grind_size", "water_temp", "brew_time", "method", "grinder", "clicks", "coffee_dose", "water_dose", "notes", "rating", "created_at", "updated_at" FROM `brew_sessions`;--> statement-breakpoint
DROP TABLE `brew_sessions`;--> statement-breakpoint
ALTER TABLE `__new_brew_sessions` RENAME TO `brew_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_coffee_beans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`roaster` text NOT NULL,
	`origin` text,
	`roast_level` text,
	`user_id` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_coffee_beans`("id", "name", "roaster", "origin", "roast_level", "user_id", "created_at", "updated_at") SELECT "id", "name", "roaster", "origin", "roast_level", "user_id", "created_at", "updated_at" FROM `coffee_beans`;--> statement-breakpoint
DROP TABLE `coffee_beans`;--> statement-breakpoint
ALTER TABLE `__new_coffee_beans` RENAME TO `coffee_beans`;--> statement-breakpoint
CREATE TABLE `__new_tasting_notes` (
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tasting_notes`("id", "brew_session_id", "user_id", "aroma", "flavor", "body", "acidity", "rating", "free_text", "created_at") SELECT "id", "brew_session_id", "user_id", "aroma", "flavor", "body", "acidity", "rating", "free_text", "created_at" FROM `tasting_notes`;--> statement-breakpoint
DROP TABLE `tasting_notes`;--> statement-breakpoint
ALTER TABLE `__new_tasting_notes` RENAME TO `tasting_notes`;