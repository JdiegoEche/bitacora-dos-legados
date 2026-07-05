ALTER TABLE `brew_sessions` ADD `share_token` text;--> statement-breakpoint
ALTER TABLE `brew_sessions` ADD `is_public` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `brew_sessions_share_token_unique` ON `brew_sessions` (`share_token`);