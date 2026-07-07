-- Fix column types: brew_time and rating should be text, not integer
-- brewTime like "2:30" and rating like "1:15" are text values

ALTER TABLE "brew_sessions" ALTER COLUMN "brew_time" TYPE text;
ALTER TABLE "brew_sessions" ALTER COLUMN "rating" TYPE text;
