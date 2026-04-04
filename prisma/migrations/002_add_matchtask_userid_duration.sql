-- Migration: add durationHours to Match, add userId to MatchTask
-- Run this against the D1 production database

-- Step 1: Add durationHours column to Match (default 24h)
ALTER TABLE "Match" ADD COLUMN "durationHours" INTEGER NOT NULL DEFAULT 24;

-- Step 2: Add userId column to MatchTask
ALTER TABLE "MatchTask" ADD COLUMN "userId" TEXT;

-- Step 3: Backfill existing MatchTasks with the challengerId from their match
-- (old tasks before this change had no user context — assign them to challenger)
UPDATE "MatchTask" 
SET "userId" = (SELECT "challengerId" FROM "Match" WHERE "Match"."id" = "MatchTask"."matchId")
WHERE "userId" IS NULL;

-- Step 4: Update categories to new naming (Critical/Important/Relaxing)
UPDATE "Category" SET "name" = 'Critical',  "weight" = 4, "description" = 'High-impact tasks. e.g. Studying, Exam Prep, Deep Work', "color" = '#6366f1' WHERE "id" = 'cat_1';
UPDATE "Category" SET "name" = 'Important', "weight" = 2, "description" = 'Valuable tasks. e.g. Learning to code, Fitness, Side projects', "color" = '#f59e0b' WHERE "id" = 'cat_2';
UPDATE "Category" SET "name" = 'Relaxing',  "weight" = 1, "description" = 'Rest and hobbies. e.g. Watching films, Drawing, Reading Webtoons', "color" = '#10b981' WHERE "id" = 'cat_3';

-- Also handle if categories were inserted with different names
UPDATE "Category" SET "name" = 'Critical',  "weight" = 4 WHERE "name" = 'Important' AND "weight" = 4;
UPDATE "Category" SET "name" = 'Important', "weight" = 2 WHERE "name" = 'Less Important';
UPDATE "Category" SET "name" = 'Relaxing',  "weight" = 1 WHERE "name" = 'For Relaxing';

-- Step 5: Insert test users (mizu + ray) if they don't exist
INSERT OR IGNORE INTO "User" ("id", "username", "email", "passwordHash", "rank", "streak", "allTimeScore", "createdAt", "updatedAt")
VALUES ('user_mizu', 'mizu', 'mizu@gmail.com', '$2b$10$BAD3ZfvlHu4MLoMacE9yE.VCdIw5ABG9V6tJ1PH9BEIJl1H.RCIHW', 'Bronze', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "User" ("id", "username", "email", "passwordHash", "rank", "streak", "allTimeScore", "createdAt", "updatedAt")
VALUES ('user_ray', 'ray', 'ray@gmail.com', '$2b$10$6ajGuL9Il6ab6GTLnZR00ep7G1upoBRXE49.oRO0ZPrMVyrcpHCMq', 'Bronze', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
